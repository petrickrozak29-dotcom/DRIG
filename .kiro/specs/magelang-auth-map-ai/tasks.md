# Implementation Plan: Login & User Management, Smart Map Integration, AI Assistant

## Overview

Dokumen ini merupakan breakdown dari requirements menjadi implementasi tasks yang dapat dikerjakan secara paralel atau sekuensial. Setiap task memiliki acceptance criteria yang terukur dan mencakup property-based testing untuk critical components.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "name": "Infrastructure Setup",
      "tasks": ["1.1", "1.2", "1.3"],
      "parallel": true
    },
    {
      "wave": 2,
      "name": "Backend Services",
      "tasks": ["2.1", "2.2", "3.1", "4.1"],
      "parallel": true,
      "dependsOn": ["1.1"]
    },
    {
      "wave": 3,
      "name": "Additional Services",
      "tasks": ["3.2", "4.2", "4.3", "4.4"],
      "parallel": true,
      "dependsOn": ["2.1", "3.1", "4.1"]
    },
    {
      "wave": 4,
      "name": "API Routes",
      "tasks": ["5.1", "5.2", "5.3", "5.4"],
      "parallel": true,
      "dependsOn": ["2.1", "2.2", "3.1", "3.2", "4.1", "4.2", "4.3", "4.4"]
    },
    {
      "wave": 5,
      "name": "Frontend Pages",
      "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5"],
      "parallel": true,
      "dependsOn": ["5.1", "5.2", "5.3", "5.4"]
    },
    {
      "wave": 6,
      "name": "Testing & Integration",
      "tasks": ["7.1", "7.2", "7.3"],
      "parallel": true,
      "dependsOn": ["5.1", "5.2", "5.3", "5.4", "6.1", "6.2", "6.3", "6.4", "6.5"]
    }
  ]
}
```

## Tasks

### Wave 1: Infrastructure Setup

- [x] 1.1 Update Prisma Schema untuk User Management. Extend Prisma schema dengan User, UserPreferences, UserLocation, SavedItinerary models dengan proper indexes dan relationships. Duration: 2 hours. Validates: Requirements 1, 5, 6, 8, 9, 13

- [x] 1.2 Setup Redis Cache Connection. Install redis package, create RedisClient wrapper dengan connection pooling, implement cache TTL strategies, add error handling dan fallback. Duration: 2 hours. Validates: Requirements 14, 20

- [ ] 1.3 Setup OpenAI API Integration. Install openai package, create OpenAI client wrapper dengan error handling, implement retry logic dengan exponential backoff, setup prompt templates. Duration: 2 hours. Validates: Requirements 15, 17

### Wave 2: Backend Services - Authentication & Location

- [ ] 2.1 Implement AuthService dengan Login & Registration. Implement register(), login(), verifyToken(), refreshAccessToken() functions dengan bcrypt hashing dan JWT generation. Include property-based tests untuk password validation dan token claims. Duration: 4 hours. Validates: Requirements 1, 2, 3, 4, 7, 19

- [ ] 2.2 Implement UserService untuk Profile & Preferences. Implement getUserProfile(), updateUserProfile(), getUserPreferences(), updateUserPreferences() dengan validation. Include cache invalidation events. Duration: 2 hours. Validates: Requirements 5, 6, 18

- [ ] 3.1 Implement LocationService dengan Haversine Distance. Implement haversineDistance(), updateUserLocation(), getUserLocation(), getLocationHistory() functions dengan ±0.01 km precision. Include property-based tests untuk distance symmetry. Duration: 3 hours. Validates: Requirements 8, 9, 10, 13

- [ ] 4.1 Implement Recommendation Scoring Algorithm. Implement scoreDestinations() dengan proximity-based scoring (distance, category, rating, budget, accessibility components). Include property-based tests untuk score bounds dan ordering. Duration: 4 hours. Validates: Requirements 14, 18

### Wave 3: Backend Services - Advanced Features

- [ ] 3.2 Implement Nearby Destinations Query. Implement getNearbyDestinations() dengan Redis caching, distance filtering, sorting by proximity. Achieve < 200ms response time. Duration: 2 hours. Validates: Requirements 11, 14

- [ ] 4.2 Implement Itinerary Generation Algorithm. Implement greedy itinerary generation dengan time/budget constraints, minimum 2 destinations, chronological ordering. Include property-based tests untuk feasibility. Duration: 3 hours. Validates: Requirements 15, 16

- [ ] 4.3 Integrate OpenAI API untuk AI Summary. Implement generateItinerarySummary(), generateDestinationInsights() dengan LLM calls, error handling, caching. Duration: 2 hours. Validates: Requirements 15, 17

- [ ] 4.4 Implement Itinerary Save & Retrieval. Implement saveItinerary(), getUserItineraries(), getItinerary(), deleteItinerary() (soft delete), rateItinerary(). Duration: 2 hours. Validates: Requirements 16, 18

### Wave 4: API Routes Implementation

- [ ] 5.1 Implement Authentication Routes. Create POST /api/auth/register, /api/auth/login, /api/auth/refresh, /api/auth/logout, /api/auth/forgot-password, /api/auth/reset-password, /api/auth/setup-2fa, /api/auth/verify-2fa dengan rate limiting dan validation. Duration: 3 hours. Validates: Requirements 1, 2, 3, 4, 7

- [ ] 5.2 Implement User Routes. Create GET /api/users/profile, PUT /api/users/profile, GET /api/users/preferences, PUT /api/users/preferences, DELETE /api/users/account dengan JWT middleware. Duration: 2 hours. Validates: Requirements 5, 6

- [ ] 5.3 Implement Location Routes. Create POST /api/locations/update, GET /api/locations/current, GET /api/locations/history, DELETE /api/locations/history, GET /api/destinations/nearby. Duration: 2 hours. Validates: Requirements 8, 9, 10, 11, 13

- [ ] 5.4 Implement AI Recommendation Routes. Create GET /api/recommendations/score, POST /api/ai/generate-itinerary, GET /api/ai/destination-insights/{id}, POST /api/itineraries, GET /api/itineraries, GET /api/itineraries/{id}, PUT /api/itineraries/{id}, DELETE /api/itineraries/{id}, POST /api/itineraries/{id}/rate. Duration: 3 hours. Validates: Requirements 14, 15, 16, 17, 18

### Wave 5: Frontend Implementation

- [ ] 6.1 Implement Login & Registration Pages. Create frontend/app/login/page.tsx dengan email/password inputs, validation, error handling, 2FA prompt. Create frontend/app/register/page.tsx dengan password strength indicator. Duration: 4 hours. Validates: Requirements 1, 2, 3, 4, 19

- [ ] 6.2 Implement Smart Map Component. Create frontend/app/smart-map/page.tsx dengan Leaflet.js map, user location marker (blue dot), destination markers (red pins), real-time updates, click handlers. Duration: 5 hours. Validates: Requirements 12, 20

- [ ] 6.3 Implement AI Assistant Page. Create frontend/app/ai-assistant/page.tsx dengan preference form, itinerary display, save button, saved itineraries list, error handling. Duration: 5 hours. Validates: Requirements 15, 16, 17

- [ ] 6.4 Implement User Profile & Settings Page. Create frontend/app/profile/page.tsx dengan profile edit form, preferences section, 2FA management, password change, logout/delete account buttons. Duration: 4 hours. Validates: Requirements 5, 6, 19

- [ ] 6.5 Add Global Authentication Context & Middleware. Create AuthContext dengan user/token/loading state, implement useAuth() hook, add ProtectedRoute component, token refresh logic, auto-logout. Duration: 3 hours. Validates: Requirements 19, 20

### Wave 6: Testing & Integration

- [ ] 7.1 Implement End-to-End Tests. Create Cypress/Playwright tests untuk: registration→login→profile, login→location→map, map→destination detail, AI→generate→save itinerary, retrieve→rate. Duration: 4 hours. Validates: All Requirements

- [ ] 7.2 Load Testing & Performance Benchmarking. Simulate 100 concurrent logins, 50 concurrent itinerary generations, monitor response times/CPU/memory. Document results. Duration: 3 hours. Validates: Requirements 22

- [ ] 7.3 Security Testing & Vulnerability Scan. Test SQL injection, XSS, CSRF, rate limiting, JWT validation using OWASP ZAP. Fix vulnerabilities found. Duration: 3 hours. Validates: Requirements 21

## Notes

### Implementation Guidelines

1. **Database**: Use Prisma migrations untuk semua schema changes
2. **Services**: Implement dengan dependency injection pattern
3. **API Routes**: Use Express middleware untuk validation dan error handling
4. **Frontend**: Use React Context API untuk state management (no Redux needed)
5. **Caching**: Start dengan in-memory cache, upgrade ke Redis if needed
6. **Testing**: Run tests sebelum commit, maintain > 80% coverage
7. **Security**: Never commit secrets, use .env files untuk config
8. **Performance**: Monitor response times, target < 200ms untuk most APIs

### Key Dependencies to Install

Backend:
```bash
npm install bcryptjs jsonwebtoken cors zod dotenv redis openai
npm install -D jest ts-jest supertest @types/jest
```

Frontend:
```bash
npm install leaflet react-leaflet axios zod
npm install -D typescript @types/react @types/node
```

### Environment Variables Required

Backend:
```
DATABASE_URL=postgresql://user:password@localhost:5432/magelang
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
JWT_EXPIRE=900
REFRESH_TOKEN_EXPIRE=604800
OPENAI_API_KEY=sk-...
EMAIL_SERVICE=sendgrid (or similar)
EMAIL_FROM=noreply@magelang.com
```

Frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAP_CENTER_LAT=7.4728
NEXT_PUBLIC_MAP_CENTER_LNG=110.2122
```

### Testing Commands

```bash
# Unit tests
npm run test

# Test coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Load testing
npm run test:load
```

### Deployment Checklist

- [ ] Environment variables configured (.env files)
- [ ] Database migrations run
- [ ] Redis cache available
- [ ] OpenAI API key configured
- [ ] Email service configured
- [ ] HTTPS certificates ready
- [ ] CORS configured
- [ ] Rate limiting configured
- [ ] Logging setup
- [ ] Error monitoring setup
- [ ] Database backups configured
- [ ] Load balancer configured
- [ ] Monitoring dashboards ready
- [ ] Runbooks for common issues created
- [ ] Documentation complete
