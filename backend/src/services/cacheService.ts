/**
 * Cache Service - High-level caching utilities using RedisClient
 * 
 * Provides convenient methods for caching common data types with
 * appropriate TTL strategies.
 * 
 * Validates Requirements 14 (Proximity-Based Scoring with caching)
 * and 20 (Real-Time Location Updates with caching)
 */

import redisClient, { CacheTTL } from './redisClient';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

interface Destination {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  rating: number;
}

interface DestinationWithDistance extends Destination {
  distance: number;
  estimatedTravelTime: number;
}

interface RecommendationScore {
  destinationId: string;
  score: number;
  distance: number;
  breakdown: {
    distanceScore: number;
    categoryRelevance: number;
    ratingScore: number;
    budgetScore: number;
    accessibilityScore: number;
  };
}

interface AIInsights {
  tips: string[];
  bestTimeToVisit: string;
  localRecommendations: string[];
  historicalInfo?: string;
  estimatedVisitTime?: number;
}

export class CacheService {
  /**
   * Cache current user location
   * TTL: 1 minute (frequent updates expected)
   */
  async cacheUserLocation(userId: string, location: UserLocation): Promise<void> {
    const key = `location:current:${userId}`;
    await redisClient.setJSON(key, location, CacheTTL.LOCATION_CURRENT);
  }

  /**
   * Get cached user location
   */
  async getUserLocation(userId: string): Promise<UserLocation | null> {
    const key = `location:current:${userId}`;
    return await redisClient.getJSON<UserLocation>(key);
  }

  /**
   * Invalidate user location cache
   */
  async invalidateUserLocation(userId: string): Promise<void> {
    const key = `location:current:${userId}`;
    await redisClient.delete(key);
  }

  /**
   * Cache nearby destinations for a user
   * TTL: 5 minutes
   */
  async cacheNearbyDestinations(
    userId: string,
    radius: number,
    destinations: DestinationWithDistance[]
  ): Promise<void> {
    const key = `destinations:nearby:${userId}:${radius}`;
    await redisClient.setJSON(key, destinations, CacheTTL.NEARBY_DESTINATIONS);
  }

  /**
   * Get cached nearby destinations
   */
  async getNearbyDestinations(
    userId: string,
    radius: number
  ): Promise<DestinationWithDistance[] | null> {
    const key = `destinations:nearby:${userId}:${radius}`;
    return await redisClient.getJSON<DestinationWithDistance[]>(key);
  }

  /**
   * Cache calculated distance between user and destination
   * TTL: 5 minutes (per user-destination pair)
   */
  async cacheDistance(
    userId: string,
    destinationId: string,
    distance: number,
    travelTime: number
  ): Promise<void> {
    const key = `distance:${userId}:${destinationId}`;
    const data = {
      distance,
      travelTime,
      calculatedAt: new Date().toISOString(),
    };
    await redisClient.setJSON(key, data, CacheTTL.DESTINATION_DISTANCE);
  }

  /**
   * Get cached distance
   */
  async getDistance(
    userId: string,
    destinationId: string
  ): Promise<{ distance: number; travelTime: number; calculatedAt: string } | null> {
    const key = `distance:${userId}:${destinationId}`;
    return await redisClient.getJSON(key);
  }

  /**
   * Cache recommendation scores for a user
   * TTL: 30 minutes
   */
  async cacheRecommendations(
    userId: string,
    recommendations: RecommendationScore[]
  ): Promise<void> {
    const key = `recommendations:${userId}`;
    await redisClient.setJSON(key, recommendations, CacheTTL.RECOMMENDATIONS);
  }

  /**
   * Get cached recommendations
   */
  async getRecommendations(userId: string): Promise<RecommendationScore[] | null> {
    const key = `recommendations:${userId}`;
    return await redisClient.getJSON<RecommendationScore[]>(key);
  }

  /**
   * Invalidate all recommendation-related caches for a user
   * Call this when user preferences change
   */
  async invalidateUserRecommendations(userId: string): Promise<void> {
    await redisClient.deletePattern(`recommendations:${userId}*`);
    await redisClient.deletePattern(`destinations:nearby:${userId}*`);
    await redisClient.deletePattern(`distance:${userId}*`);
  }

  /**
   * Cache AI-generated insights for a destination
   * TTL: 24 hours (rarely changes)
   */
  async cacheAIInsights(destinationId: string, insights: AIInsights): Promise<void> {
    const key = `ai:insights:${destinationId}`;
    await redisClient.setJSON(key, insights, CacheTTL.AI_INSIGHTS);
  }

  /**
   * Get cached AI insights
   */
  async getAIInsights(destinationId: string): Promise<AIInsights | null> {
    const key = `ai:insights:${destinationId}`;
    return await redisClient.getJSON<AIInsights>(key);
  }

  /**
   * Cache user preferences
   * TTL: 10 minutes
   */
  async cacheUserPreferences(userId: string, preferences: any): Promise<void> {
    const key = `preferences:${userId}`;
    await redisClient.setJSON(key, preferences, CacheTTL.USER_PREFERENCES);
  }

  /**
   * Get cached user preferences
   */
  async getUserPreferences(userId: string): Promise<any | null> {
    const key = `preferences:${userId}`;
    return await redisClient.getJSON(key);
  }

  /**
   * Invalidate user preferences cache
   * Call this when user updates their preferences
   */
  async invalidateUserPreferences(userId: string): Promise<void> {
    const key = `preferences:${userId}`;
    await redisClient.delete(key);
  }

  /**
   * Track rate limiting for an IP address
   * Returns remaining attempts
   */
  async trackRateLimit(
    identifier: string,
    maxAttempts: number,
    windowSeconds: number
  ): Promise<{ attempts: number; remaining: number; resetAt: number }> {
    const key = `ratelimit:${identifier}`;
    const attempts = await redisClient.increment(key, 1);

    // Set TTL on first attempt
    if (attempts === 1) {
      await redisClient.set(key, '1', windowSeconds);
    }

    const ttl = await redisClient.ttl(key);
    const remaining = Math.max(0, maxAttempts - attempts);
    const resetAt = Date.now() + ttl * 1000;

    return { attempts, remaining, resetAt };
  }

  /**
   * Check if rate limit exceeded
   */
  async isRateLimited(identifier: string, maxAttempts: number): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    const value = await redisClient.get(key);
    if (!value) return false;
    return parseInt(value, 10) >= maxAttempts;
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetRateLimit(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;
    await redisClient.delete(key);
  }

  /**
   * Cache session data
   * TTL: 15 minutes
   */
  async cacheSession(sessionId: string, data: any): Promise<void> {
    const key = `session:${sessionId}`;
    await redisClient.setJSON(key, data, CacheTTL.SESSION);
  }

  /**
   * Get cached session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    return await redisClient.getJSON(key);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await redisClient.delete(key);
  }

  /**
   * Generic get operation
   */
  async get(key: string): Promise<any> {
    return await redisClient.getJSON(key);
  }

  /**
   * Generic set operation
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await redisClient.setJSON(key, value, ttl ?? CacheTTL.SESSION);
  }

  /**
   * Get cache statistics
   */
  getStatus() {
    return redisClient.getStatus();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return await redisClient.healthCheck();
  }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService;
