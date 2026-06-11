# Redis Cache Setup Guide

## Overview

This application uses Redis as a caching layer to improve performance for:
- User location data (1 minute TTL)
- Nearby destinations (5 minutes TTL)
- Distance calculations (5 minutes TTL)
- Recommendation scores (30 minutes TTL)
- AI insights (24 hours TTL)
- User preferences (10 minutes TTL)
- Session data (15 minutes TTL)

## Features

### ✅ Connection Pooling
Redis client is configured with automatic connection management and pooling for optimal performance.

### ✅ Error Handling & Fallback
- Automatic fallback to in-memory cache when Redis is unavailable
- Graceful degradation ensures application continues working
- Automatic retry with exponential backoff

### ✅ TTL Strategies
Different cache TTLs based on data volatility:
- **Frequent updates** (1 min): Current user location
- **Moderate updates** (5-10 min): Nearby destinations, distances, preferences
- **Stable data** (30 min - 24 hours): Recommendations, AI insights

### ✅ Cache Invalidation
Automatic cache invalidation when:
- User updates preferences → Clear recommendations
- User location changes → Update location cache
- Destination data changes → Clear related caches

## Installation

### Option 1: Using Docker (Recommended for Development)

```bash
# Run Redis in Docker
docker run -d --name redis-magelang -p 6379:6379 redis:7-alpine

# Verify Redis is running
docker ps | grep redis
```

### Option 2: Windows Installation

1. Download Redis for Windows:
   - https://github.com/microsoftarchive/redis/releases
   - Or use WSL2 with Redis installed

2. Start Redis:
   ```bash
   redis-server
   ```

### Option 3: Linux/macOS Installation

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""  # Leave empty for local development
```

### Optional Configuration

For production environments:

```env
REDIS_URL="redis://your-redis-host:6379"
REDIS_PASSWORD="your-secure-password"
```

## Usage Examples

### Basic Cache Operations

```typescript
import redisClient, { CacheTTL } from './services/redisClient';

// Set a value with TTL
await redisClient.set('key', 'value', CacheTTL.SESSION);

// Get a value
const value = await redisClient.get('key');

// Set JSON data
await redisClient.setJSON('user:123', { name: 'John', age: 30 }, CacheTTL.SESSION);

// Get JSON data
const user = await redisClient.getJSON('user:123');
```

### Using Cache Service (Recommended)

```typescript
import cacheService from './services/cacheService';

// Cache user location
await cacheService.cacheUserLocation('user123', {
  latitude: 7.4728,
  longitude: 110.2122,
  accuracy: 10,
  timestamp: new Date().toISOString()
});

// Get cached location
const location = await cacheService.getUserLocation('user123');

// Cache recommendations
await cacheService.cacheRecommendations('user123', recommendations);

// Invalidate caches when preferences change
await cacheService.invalidateUserRecommendations('user123');
```

### Rate Limiting Example

```typescript
import cacheService from './services/cacheService';

// Track login attempts
const { attempts, remaining } = await cacheService.trackRateLimit(
  `login:${ipAddress}`,
  5,  // max 5 attempts
  900 // within 15 minutes
);

if (remaining === 0) {
  throw new Error('Too many login attempts. Try again later.');
}
```

## Cache Strategies by Data Type

### User Location (TTL: 1 minute)
- **Why**: Location updates frequently as user moves
- **Invalidation**: On new location update
- **Key pattern**: `location:current:{userId}`

### Nearby Destinations (TTL: 5 minutes)
- **Why**: Destination list doesn't change often
- **Invalidation**: When user moves significantly or preferences change
- **Key pattern**: `destinations:nearby:{userId}:{radius}`

### Distance Calculations (TTL: 5 minutes)
- **Why**: Haversine calculations are expensive, results stable
- **Invalidation**: When user location updates
- **Key pattern**: `distance:{userId}:{destinationId}`

### Recommendations (TTL: 30 minutes)
- **Why**: Scoring algorithm is compute-intensive
- **Invalidation**: When user preferences change
- **Key pattern**: `recommendations:{userId}`

### AI Insights (TTL: 24 hours)
- **Why**: LLM API calls are expensive and slow, content rarely changes
- **Invalidation**: Manual or scheduled refresh
- **Key pattern**: `ai:insights:{destinationId}`

### User Preferences (TTL: 10 minutes)
- **Why**: Database reads are fast but frequent
- **Invalidation**: When user updates preferences
- **Key pattern**: `preferences:{userId}`

## Monitoring & Health Check

### Check Redis Status

```bash
# Test endpoint
curl http://localhost:4000/api/health

# Expected response
{
  "status": "ok",
  "service": "MAGELANGVERSE-ID backend",
  "redis": {
    "connected": true,
    "usesFallback": false,
    "healthy": true
  }
}
```

### Programmatic Health Check

```typescript
import redisClient from './services/redisClient';

const status = redisClient.getStatus();
console.log('Redis Status:', status);

const isHealthy = await redisClient.healthCheck();
console.log('Redis Healthy:', isHealthy);
```

## Fallback Behavior

When Redis is unavailable:
- Application automatically switches to in-memory cache
- All cache operations continue working seamlessly
- Warning logged: `[Redis] Using in-memory fallback cache`
- Health endpoint shows: `"usesFallback": true`

### Performance Impact
- In-memory cache is fast but not distributed
- Data lost on application restart
- No shared cache across multiple instances

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run Redis tests only
npm test -- redisClient.test.ts

# Run with coverage
npm test:coverage
```

### Test Results
All 18 tests should pass, covering:
- ✅ Basic CRUD operations
- ✅ TTL management
- ✅ Pattern operations
- ✅ Numeric operations (counters)
- ✅ Cache strategies
- ✅ Error handling & fallback
- ✅ Real-world use cases

## Production Considerations

### Security
1. **Use strong Redis password** in production
2. **Enable SSL/TLS** for Redis connections
3. **Restrict network access** to Redis port (6379)
4. **Use Redis ACLs** to limit command access

### Performance
1. **Monitor memory usage** - Set maxmemory limit
2. **Configure eviction policy** - Recommend `volatile-lru`
3. **Use connection pooling** - Already configured
4. **Monitor slow queries** - Use Redis SLOWLOG

### High Availability
1. **Redis Sentinel** - Automatic failover
2. **Redis Cluster** - Horizontal scaling
3. **Backup strategy** - Regular RDB/AOF snapshots
4. **Monitoring** - Use Redis monitoring tools (RedisInsight, etc.)

### Recommended Configuration (Production)

```bash
# redis.conf
maxmemory 2gb
maxmemory-policy volatile-lru
timeout 300
tcp-keepalive 60
```

## Troubleshooting

### Redis Connection Failed
```
Error: [Redis] Failed to connect
```
**Solution**: 
- Check if Redis is running: `redis-cli ping` (should return "PONG")
- Verify REDIS_URL in .env
- Check firewall/network settings

### Fallback Cache Active
```
Warning: [Redis] Using in-memory fallback cache
```
**Solution**:
- This is normal if Redis not installed
- Install Redis for better performance
- No action needed for development

### Tests Failing
```
Error: Connection timeout
```
**Solution**:
- Tests work with fallback cache (no Redis needed)
- Increase test timeout in jest.config.js
- Check network/firewall blocking localhost:6379

## Performance Benchmarks

With Redis (typical):
- `GET` operation: < 1ms
- `SET` operation: < 1ms
- `getJSON` operation: < 2ms
- `setJSON` operation: < 2ms

With Fallback (in-memory):
- `GET` operation: < 0.1ms
- `SET` operation: < 0.1ms
- `getJSON` operation: < 0.5ms
- `setJSON` operation: < 0.5ms

## Support

For issues or questions:
1. Check Redis logs: `redis-cli monitor`
2. Review application logs for `[Redis]` messages
3. Check health endpoint: `/api/health`
4. Review Redis documentation: https://redis.io/docs

## References

- [Redis Official Documentation](https://redis.io/docs/)
- [Node Redis Client](https://github.com/redis/node-redis)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Redis Security](https://redis.io/docs/management/security/)
