import { OpenAIClient, OpenAIClientError, initializeOpenAIClient, getOpenAIClient } from './openaiClient';

// Mock cacheService
jest.mock('./cacheService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

import OpenAI from 'openai';
import cacheService from './cacheService';

const mockGet = cacheService.get as jest.Mock;
const mockSet = cacheService.set as jest.Mock;
let mockCreate: jest.Mock;

describe('OpenAIClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mockCreate from the mocked OpenAI instance
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
    const instance: any = new MockedOpenAI({ apiKey: 'test' });
    mockCreate = instance.chat.completions.create;
  });

  describe('Constructor', () => {
    it('should throw error if API key is not configured', () => {
      expect(() => {
        new OpenAIClient({ apiKey: '' });
      }).toThrow(OpenAIClientError);
      expect(() => {
        new OpenAIClient({ apiKey: '' });
      }).toThrow('OpenAI API key is not configured');
    });

    it('should throw error if API key is placeholder', () => {
      expect(() => {
        new OpenAIClient({ apiKey: 'sk-your-openai-api-key-here' });
      }).toThrow('using default placeholder');
    });

    it('should initialize with valid API key', () => {
      expect(() => {
        new OpenAIClient({ apiKey: 'sk-valid-key' });
      }).not.toThrow();
    });

    it('should use default retry config if not provided', () => {
      const client = new OpenAIClient({ apiKey: 'sk-valid-key' });
      expect(client).toBeDefined();
    });

    it('should use custom retry config if provided', () => {
      const client = new OpenAIClient({
        apiKey: 'sk-valid-key',
        retryConfig: {
          maxRetries: 5,
          initialDelayMs: 500,
          maxDelayMs: 5000,
          backoffMultiplier: 3,
        },
      });
      expect(client).toBeDefined();
    });
  });

  describe('generateChatCompletion', () => {
    let client: OpenAIClient;

    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'sk-valid-key' });
      mockGet.mockReset();
      mockSet.mockReset();
      mockCreate.mockReset();
    });

    it('should return cached result if cache key provided and cache hit', async () => {
      const cachedResult = 'Cached response';
      mockGet.mockResolvedValue(cachedResult);

      const result = await client.generateChatCompletion(
        [{ role: 'user', content: 'test' }],
        { cacheKey: 'test-cache-key' }
      );

      expect(result).toBe(cachedResult);
      expect(mockGet).toHaveBeenCalledWith('test-cache-key');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should call OpenAI API if cache miss', async () => {
      mockGet.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'AI response' } }],
      });

      const result = await client.generateChatCompletion(
        [{ role: 'user', content: 'test' }],
        { cacheKey: 'test-cache-key' }
      );

      expect(result).toBe('AI response');
      expect(mockGet).toHaveBeenCalledWith('test-cache-key');
      expect(mockCreate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith('test-cache-key', 'AI response', 1800);
    });

    it('should use default model gpt-4 if not specified', async () => {
      mockGet.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'AI response' } }],
      });

      await client.generateChatCompletion([{ role: 'user', content: 'test' }]);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
        })
      );
    });

    it('should use custom model if specified', async () => {
      mockGet.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'AI response' } }],
      });

      await client.generateChatCompletion([{ role: 'user', content: 'test' }], {
        model: 'gpt-3.5-turbo',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
        })
      );
    });

    it('should use default temperature 0.7 if not specified', async () => {
      mockGet.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'AI response' } }],
      });

      await client.generateChatCompletion([{ role: 'user', content: 'test' }]);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
        })
      );
    });

    it('should use custom temperature if specified', async () => {
      mockGet.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'AI response' } }],
      });

      await client.generateChatCompletion([{ role: 'user', content: 'test' }], {
        temperature: 0.5,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
        })
      );
    });

    it('should throw error if no content in response', async () => {
      mockGet.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        choices: [{ message: {} }],
      });

      await expect(
        client.generateChatCompletion([{ role: 'user', content: 'test' }])
      ).rejects.toThrow('No content in OpenAI response');
    });
  });

  describe('Retry Logic', () => {
    let client: OpenAIClient;

    beforeEach(() => {
      client = new OpenAIClient({
        apiKey: 'sk-valid-key',
        retryConfig: {
          maxRetries: 2,
          initialDelayMs: 10, // Fast for testing
          maxDelayMs: 50,
          backoffMultiplier: 2,
        },
      });
      mockGet.mockResolvedValue(null);
      mockCreate.mockReset();
    });

    it('should retry on 5xx server errors', async () => {
      mockCreate
        .mockRejectedValueOnce({ status: 500, message: 'Server error' })
        .mockRejectedValueOnce({ status: 503, message: 'Service unavailable' })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success after retries' } }],
        });

      const result = await client.generateChatCompletion([
        { role: 'user', content: 'test' },
      ]);

      expect(result).toBe('Success after retries');
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should NOT retry on 4xx client errors', async () => {
      mockCreate.mockRejectedValue({ status: 400, message: 'Bad request' });

      await expect(
        client.generateChatCompletion([{ role: 'user', content: 'test' }])
      ).rejects.toThrow(OpenAIClientError);

      expect(mockCreate).toHaveBeenCalledTimes(1); // No retries
    });

    it('should throw after max retries exhausted', async () => {
      mockCreate.mockRejectedValue({ status: 500, message: 'Server error' });

      await expect(
        client.generateChatCompletion([{ role: 'user', content: 'test' }])
      ).rejects.toThrow('failed after 3 attempts');

      expect(mockCreate).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should implement exponential backoff', async () => {
      const startTime = Date.now();
      mockCreate.mockRejectedValue({ status: 500, message: 'Server error' });

      await expect(
        client.generateChatCompletion([{ role: 'user', content: 'test' }])
      ).rejects.toThrow();

      const duration = Date.now() - startTime;
      // Should wait at least: 10ms + 20ms = 30ms
      expect(duration).toBeGreaterThanOrEqual(25);
    });
  });

  describe('healthCheck', () => {
    let client: OpenAIClient;

    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'sk-valid-key' });
      mockCreate.mockReset();
    });

    it('should return true if API is healthy', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'test' } }],
      });

      const result = await client.healthCheck();

      expect(result).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        })
      );
    });

    it('should return false if API is unhealthy', async () => {
      mockCreate.mockRejectedValue({ status: 500, message: 'Server error' });

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('Singleton pattern', () => {
    it('should initialize singleton instance', () => {
      const instance = initializeOpenAIClient({ apiKey: 'sk-valid-key' });
      expect(instance).toBeInstanceOf(OpenAIClient);
    });

    it('should throw error if getting client before initialization', () => {
      // Reset module to clear singleton
      jest.resetModules();
      jest.isolateModules(() => {
        const { getOpenAIClient } = require('./openaiClient');

        expect(() => {
          getOpenAIClient();
        }).toThrow('OpenAI client not initialized');
      });
    });
  });

  describe('Error handling', () => {
    let client: OpenAIClient;

    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'sk-valid-key' });
      mockGet.mockResolvedValue(null);
      mockCreate.mockReset();
    });

    it('should wrap OpenAI errors in OpenAIClientError', async () => {
      mockCreate.mockRejectedValue({ status: 401, message: 'Invalid API key' });

      await expect(
        client.generateChatCompletion([{ role: 'user', content: 'test' }])
      ).rejects.toThrow(OpenAIClientError);
    });

    it('should include status code in error', async () => {
      mockCreate.mockRejectedValue({ status: 401, message: 'Invalid API key' });

      try {
        await client.generateChatCompletion([{ role: 'user', content: 'test' }]);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(OpenAIClientError);
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('Caching behavior', () => {
    let client: OpenAIClient;

    beforeEach(() => {
      client = new OpenAIClient({ apiKey: 'sk-valid-key' });
      mockGet.mockReset();
      mockSet.mockReset();
      mockCreate.mockReset();
    });

    it('should cache result with custom TTL', async () => {
      mockGet.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'AI response' } }],
      });

      await client.generateChatCompletion(
        [{ role: 'user', content: 'test' }],
        { cacheKey: 'test-key', cacheTTL: 3600 }
      );

      expect(mockSet).toHaveBeenCalledWith('test-key', 'AI response', 3600);
    });

    it('should not cache if no cache key provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'AI response' } }],
      });

      await client.generateChatCompletion([{ role: 'user', content: 'test' }]);

      expect(mockGet).not.toHaveBeenCalled();
      expect(mockSet).not.toHaveBeenCalled();
    });
  });
});
