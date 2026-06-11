import OpenAI from 'openai';
import cacheService from './cacheService';

/**
 * OpenAI Client Wrapper dengan Error Handling dan Retry Logic
 * Validates: Requirements 15 (AI-Powered Itinerary), 17 (AI Insights)
 */

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

interface OpenAIClientConfig {
  apiKey: string;
  retryConfig?: RetryConfig;
  timeout?: number;
}

export class OpenAIClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'OpenAIClientError';
  }
}

export class OpenAIClient {
  private client: OpenAI;
  private retryConfig: RetryConfig;
  private timeout: number;

  constructor(config: OpenAIClientConfig) {
    if (!config.apiKey || config.apiKey === 'sk-your-openai-api-key-here') {
      throw new OpenAIClientError('OpenAI API key is not configured or is using default placeholder');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout || 30000, // 30 seconds default
    });

    this.retryConfig = config.retryConfig || {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    };

    this.timeout = config.timeout || 30000;
  }

  /**
   * Exponential backoff retry mechanism
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error?.status && error.status >= 400 && error.status < 500) {
          throw new OpenAIClientError(
            `OpenAI API client error: ${error.message || 'Unknown error'}`,
            error.status,
            error
          );
        }

        // Last attempt - throw error
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Log retry attempt
        console.warn(
          `${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}): ${
            error.message
          }. Retrying in ${delay}ms...`
        );

        // Wait before retry
        await this.sleep(delay);

        // Exponential backoff with cap
        delay = Math.min(
          delay * this.retryConfig.backoffMultiplier,
          this.retryConfig.maxDelayMs
        );
      }
    }

    // All retries exhausted
    throw new OpenAIClientError(
      `${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts: ${
        lastError?.message || 'Unknown error'
      }`,
      undefined,
      lastError
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate chat completion dengan retry logic
   */
  async generateChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      cacheKey?: string;
      cacheTTL?: number;
    }
  ): Promise<string> {
    // Check cache first
    if (options?.cacheKey) {
      const cached = await cacheService.get(options.cacheKey);
      if (cached) {
        console.log(`Cache hit for OpenAI request: ${options.cacheKey}`);
        return cached as string;
      }
    }

    const result = await this.withRetry(async () => {
      const completion = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens || 1000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      return content;
    }, 'generateChatCompletion');

    // Cache the result
    if (options?.cacheKey) {
      await cacheService.set(
        options.cacheKey,
        result,
        options.cacheTTL || 1800 // 30 minutes default
      );
    }

    return result;
  }

  /**
   * Health check untuk verify API key dan connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.withRetry(async () => {
        const completion = await this.client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        });
        return completion;
      }, 'healthCheck');
      return true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let openaiClientInstance: OpenAIClient | null = null;

export function initializeOpenAIClient(config: OpenAIClientConfig): OpenAIClient {
  openaiClientInstance = new OpenAIClient(config);
  return openaiClientInstance;
}

export function getOpenAIClient(): OpenAIClient {
  if (!openaiClientInstance) {
    throw new OpenAIClientError('OpenAI client not initialized. Call initializeOpenAIClient first.');
  }
  return openaiClientInstance;
}
