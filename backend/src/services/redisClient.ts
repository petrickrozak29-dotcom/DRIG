import { createClient, RedisClientType } from 'redis';

/**
 * RedisClient Wrapper with Connection Pooling, Error Handling, and Fallback
 * 
 * Features:
 * - Automatic connection management with retry logic
 * - Graceful fallback to in-memory cache when Redis unavailable
 * - TTL strategies for different data types
 * - Error handling and logging
 * - Connection pooling support
 * 
 * Validates Requirements 14 (Proximity-Based Scoring with caching) 
 * and 20 (Real-Time Location Updates with caching)
 */

// TTL strategies (in seconds)
export const CacheTTL = {
  LOCATION_CURRENT: 60,          // 1 minute - current user location
  LOCATION_HISTORY: 300,         // 5 minutes - location history
  NEARBY_DESTINATIONS: 300,      // 5 minutes - nearby destinations list
  DESTINATION_DISTANCE: 300,     // 5 minutes - calculated distances
  RECOMMENDATIONS: 1800,         // 30 minutes - recommendation scores
  AI_INSIGHTS: 86400,            // 24 hours - AI-generated insights
  USER_PREFERENCES: 600,         // 10 minutes - user preferences
  SESSION: 900,                  // 15 minutes - session data
} as const;

// In-memory fallback cache
interface CacheEntry {
  value: string;
  expiresAt: number;
}

class InMemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  set(key: string, value: string, ttl: number): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

class RedisClientWrapper {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private usesFallback: boolean = false;
  private fallbackCache: InMemoryCache;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000; // 5 seconds

  constructor() {
    this.fallbackCache = new InMemoryCache();
  }

  /**
   * Initialize Redis connection with error handling and fallback
   */
  async connect(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    
    // If Redis URL not configured, use fallback immediately
    if (!redisUrl) {
      console.warn('[Redis] REDIS_URL not configured. Using in-memory fallback cache.');
      this.usesFallback = true;
      this.isConnected = true;
      return;
    }

    try {
      // Create Redis client with connection pooling
      this.client = createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              console.error('[Redis] Max reconnection attempts reached. Switching to fallback.');
              this.switchToFallback();
              return false; // Stop reconnecting
            }
            console.log(`[Redis] Reconnection attempt ${retries}/${this.maxReconnectAttempts}`);
            return Math.min(retries * 1000, 5000); // Exponential backoff, max 5s
          },
          connectTimeout: 10000, // 10 seconds
        },
      });

      // Error handling
      this.client.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
        if (!this.usesFallback) {
          this.switchToFallback();
        }
      });

      this.client.on('connect', () => {
        console.log('[Redis] Connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('ready', () => {
        console.log('[Redis] Client ready');
        this.usesFallback = false;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        console.log('[Redis] Reconnecting...');
      });

      this.client.on('end', () => {
        console.log('[Redis] Connection closed');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
    } catch (error: any) {
      console.error('[Redis] Failed to connect:', error.message);
      this.switchToFallback();
    }
  }

  /**
   * Switch to in-memory fallback cache
   */
  private switchToFallback(): void {
    console.warn('[Redis] Switching to in-memory fallback cache');
    this.usesFallback = true;
    this.isConnected = true; // Mark as connected to allow operations
    
    if (this.client) {
      this.client.disconnect().catch(() => {
        // Ignore disconnect errors
      });
      this.client = null;
    }
  }

  /**
   * Get value from cache with fallback support
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      console.warn('[Redis] Not connected. Using fallback.');
      return this.fallbackCache.get(key);
    }

    if (this.usesFallback) {
      return this.fallbackCache.get(key);
    }

    try {
      if (!this.client) return this.fallbackCache.get(key);
      return await this.client.get(key);
    } catch (error: any) {
      console.error('[Redis] GET error:', error.message);
      return this.fallbackCache.get(key);
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: string, ttl: number): Promise<void> {
    if (!this.isConnected) {
      console.warn('[Redis] Not connected. Using fallback.');
      this.fallbackCache.set(key, value, ttl);
      return;
    }

    if (this.usesFallback) {
      this.fallbackCache.set(key, value, ttl);
      return;
    }

    try {
      if (!this.client) {
        this.fallbackCache.set(key, value, ttl);
        return;
      }
      await this.client.setEx(key, ttl, value);
    } catch (error: any) {
      console.error('[Redis] SET error:', error.message);
      // Fallback to in-memory
      this.fallbackCache.set(key, value, ttl);
    }
  }

  /**
   * Set value in cache with JSON serialization
   */
  async setJSON(key: string, value: any, ttl: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.set(key, serialized, ttl);
  }

  /**
   * Get value from cache with JSON deserialization
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error: any) {
      console.error('[Redis] JSON parse error:', error.message);
      return null;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    if (this.usesFallback) {
      this.fallbackCache.delete(key);
      return;
    }

    try {
      if (this.client) {
        await this.client.del(key);
      }
    } catch (error: any) {
      console.error('[Redis] DELETE error:', error.message);
      this.fallbackCache.delete(key);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (this.usesFallback) {
      // For in-memory cache, manually match and delete
      const keys = Array.from(this.fallbackCache['cache'].keys());
      const regex = new RegExp(pattern.replace('*', '.*'));
      keys.filter(k => regex.test(k)).forEach(k => this.fallbackCache.delete(k));
      return;
    }

    try {
      if (!this.client) return;
      
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error: any) {
      console.error('[Redis] DELETE PATTERN error:', error.message);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.usesFallback) {
      return this.fallbackCache.get(key) !== null;
    }

    try {
      if (!this.client) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      console.error('[Redis] EXISTS error:', error.message);
      return false;
    }
  }

  /**
   * Get TTL of a key in seconds
   */
  async ttl(key: string): Promise<number> {
    if (this.usesFallback) {
      const entry = this.fallbackCache['cache'].get(key);
      if (!entry) return -2; // Key doesn't exist
      const remaining = Math.floor((entry.expiresAt - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    }

    try {
      if (!this.client) return -2;
      return await this.client.ttl(key);
    } catch (error: any) {
      console.error('[Redis] TTL error:', error.message);
      return -2;
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, by: number = 1): Promise<number> {
    if (this.usesFallback) {
      const current = await this.get(key);
      const newValue = (parseInt(current || '0', 10) || 0) + by;
      await this.set(key, newValue.toString(), CacheTTL.SESSION);
      return newValue;
    }

    try {
      if (!this.client) return 0;
      return await this.client.incrBy(key, by);
    } catch (error: any) {
      console.error('[Redis] INCREMENT error:', error.message);
      return 0;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    isConnected: boolean;
    usesFallback: boolean;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      usesFallback: this.usesFallback,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
      }
      this.fallbackCache.destroy();
      this.isConnected = false;
    } catch (error: any) {
      console.error('[Redis] Disconnect error:', error.message);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (this.usesFallback) {
      return true; // Fallback is always healthy
    }

    try {
      if (!this.client) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error: any) {
      console.error('[Redis] Health check failed:', error.message);
      return false;
    }
  }
}

// Singleton instance
const redisClient = new RedisClientWrapper();

export default redisClient;
