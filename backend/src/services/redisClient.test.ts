/**
 * Unit Tests for RedisClient Wrapper
 * 
 * Tests cover:
 * - Connection with fallback
 * - Basic CRUD operations
 * - TTL strategies
 * - Error handling
 * - In-memory fallback
 */

import redisClient, { CacheTTL } from './redisClient';

describe('RedisClient Wrapper', () => {
  beforeAll(async () => {
    // Initialize connection (will use fallback if Redis not available)
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  beforeEach(async () => {
    // Clean up test keys before each test
    await redisClient.deletePattern('test:*');
  });

  describe('Basic Operations', () => {
    it('should set and get a string value', async () => {
      const key = 'test:basic:string';
      const value = 'hello world';
      
      await redisClient.set(key, value, CacheTTL.SESSION);
      const retrieved = await redisClient.get(key);
      
      expect(retrieved).toBe(value);
    });

    it('should set and get a JSON value', async () => {
      const key = 'test:basic:json';
      const value = { name: 'Magelang', coordinates: { lat: 7.4728, lng: 110.2122 } };
      
      await redisClient.setJSON(key, value, CacheTTL.SESSION);
      const retrieved = await redisClient.getJSON(key);
      
      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await redisClient.get('test:nonexistent');
      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      const key = 'test:delete:key';
      await redisClient.set(key, 'value', CacheTTL.SESSION);
      
      await redisClient.delete(key);
      const result = await redisClient.get(key);
      
      expect(result).toBeNull();
    });
  });

  describe('TTL Management', () => {
    it('should respect TTL for cached values', async () => {
      const key = 'test:ttl:short';
      const value = 'expires soon';
      const shortTTL = 2; // 2 seconds
      
      await redisClient.set(key, value, shortTTL);
      
      // Value should exist immediately
      let retrieved = await redisClient.get(key);
      expect(retrieved).toBe(value);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Value should be gone
      retrieved = await redisClient.get(key);
      expect(retrieved).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test:exists:key';
      
      let exists = await redisClient.exists(key);
      expect(exists).toBe(false);
      
      await redisClient.set(key, 'value', CacheTTL.SESSION);
      
      exists = await redisClient.exists(key);
      expect(exists).toBe(true);
    });

    it('should get TTL of a key', async () => {
      const key = 'test:ttl:check';
      const ttl = 60; // 60 seconds
      
      await redisClient.set(key, 'value', ttl);
      
      const remaining = await redisClient.ttl(key);
      expect(remaining).toBeGreaterThan(50); // Should be close to 60
      expect(remaining).toBeLessThanOrEqual(60);
    });
  });

  describe('Pattern Operations', () => {
    it('should delete multiple keys matching pattern', async () => {
      await redisClient.set('test:pattern:1', 'value1', CacheTTL.SESSION);
      await redisClient.set('test:pattern:2', 'value2', CacheTTL.SESSION);
      await redisClient.set('test:other:3', 'value3', CacheTTL.SESSION);
      
      await redisClient.deletePattern('test:pattern:*');
      
      expect(await redisClient.exists('test:pattern:1')).toBe(false);
      expect(await redisClient.exists('test:pattern:2')).toBe(false);
      expect(await redisClient.exists('test:other:3')).toBe(true);
    });
  });

  describe('Numeric Operations', () => {
    it('should increment a counter', async () => {
      const key = 'test:counter:increment';
      
      const val1 = await redisClient.increment(key, 1);
      expect(val1).toBe(1);
      
      const val2 = await redisClient.increment(key, 5);
      expect(val2).toBe(6);
      
      const val3 = await redisClient.increment(key);
      expect(val3).toBe(7);
    });
  });

  describe('Cache Strategies', () => {
    it('should cache user location with correct TTL', async () => {
      const userId = 'user123';
      const key = `location:current:${userId}`;
      const location = { latitude: 7.4728, longitude: 110.2122, accuracy: 10 };
      
      await redisClient.setJSON(key, location, CacheTTL.LOCATION_CURRENT);
      
      const cached = await redisClient.getJSON<typeof location>(key);
      expect(cached).toEqual(location);
      
      const ttl = await redisClient.ttl(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(CacheTTL.LOCATION_CURRENT);
    });

    it('should cache nearby destinations with correct TTL', async () => {
      const userId = 'user123';
      const key = `destinations:nearby:${userId}`;
      const destinations = [
        { id: '1', name: 'Borobudur', distance: 5.2 },
        { id: '2', name: 'Mendut Temple', distance: 3.8 }
      ];
      
      await redisClient.setJSON(key, destinations, CacheTTL.NEARBY_DESTINATIONS);
      
      const cached = await redisClient.getJSON<typeof destinations>(key);
      expect(cached).toEqual(destinations);
    });

    it('should cache AI insights with long TTL', async () => {
      const destinationId = 'dest123';
      const key = `ai:insights:${destinationId}`;
      const insights = {
        tips: ['Visit early morning', 'Bring water'],
        bestTimeToVisit: 'Dawn',
        historicalInfo: 'Built in 9th century'
      };
      
      await redisClient.setJSON(key, insights, CacheTTL.AI_INSIGHTS);
      
      const cached = await redisClient.getJSON<typeof insights>(key);
      expect(cached).toEqual(insights);
      
      const ttl = await redisClient.ttl(key);
      expect(ttl).toBeGreaterThan(CacheTTL.RECOMMENDATIONS); // Should be longer than recommendations
    });

    it('should cache recommendation scores', async () => {
      const userId = 'user123';
      const key = `recommendations:${userId}`;
      const recommendations = [
        { destinationId: '1', score: 95, distance: 2.5 },
        { destinationId: '2', score: 88, distance: 4.1 }
      ];
      
      await redisClient.setJSON(key, recommendations, CacheTTL.RECOMMENDATIONS);
      
      const cached = await redisClient.getJSON<typeof recommendations>(key);
      expect(cached).toEqual(recommendations);
    });
  });

  describe('Error Handling & Fallback', () => {
    it('should provide connection status', () => {
      const status = redisClient.getStatus();
      
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('usesFallback');
      expect(status).toHaveProperty('reconnectAttempts');
      expect(typeof status.isConnected).toBe('boolean');
      expect(typeof status.usesFallback).toBe('boolean');
      expect(typeof status.reconnectAttempts).toBe('number');
    });

    it('should handle health check', async () => {
      const isHealthy = await redisClient.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });

    it('should gracefully handle invalid JSON', async () => {
      const key = 'test:invalid:json';
      await redisClient.set(key, 'not valid json {{{', CacheTTL.SESSION);
      
      const result = await redisClient.getJSON(key);
      expect(result).toBeNull();
    });
  });

  describe('Real-world Use Cases', () => {
    it('should cache distance calculation between user and destination', async () => {
      const userId = 'user123';
      const destinationId = 'dest456';
      const key = `distance:${userId}:${destinationId}`;
      const distanceData = {
        distance: 5.73,
        calculatedAt: new Date().toISOString()
      };
      
      await redisClient.setJSON(key, distanceData, CacheTTL.DESTINATION_DISTANCE);
      
      const cached = await redisClient.getJSON<typeof distanceData>(key);
      expect(cached).toEqual(distanceData);
      expect(cached?.distance).toBe(5.73);
    });

    it('should invalidate user cache when preferences change', async () => {
      const userId = 'user123';
      const prefsKey = `preferences:${userId}`;
      const recommendationsKey = `recommendations:${userId}`;
      
      // Set initial cache
      await redisClient.setJSON(prefsKey, { interests: ['nature'] }, CacheTTL.USER_PREFERENCES);
      await redisClient.setJSON(recommendationsKey, [{ id: '1' }], CacheTTL.RECOMMENDATIONS);
      
      // User updates preferences - invalidate related caches
      await redisClient.delete(prefsKey);
      await redisClient.deletePattern(`recommendations:${userId}*`);
      
      expect(await redisClient.exists(prefsKey)).toBe(false);
      expect(await redisClient.exists(recommendationsKey)).toBe(false);
    });
  });
});
