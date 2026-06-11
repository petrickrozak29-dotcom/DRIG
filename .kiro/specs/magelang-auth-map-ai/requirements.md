# Requirements Document: Login & User Management, Smart Map Integration, AI Assistant

## Introduction

Dokumen ini merupakan specifikasi requirement dari ketiga fitur utama untuk aplikasi Magelang untuk sistem login, smart map dengan lokasi real-time, dan AI assistant untuk rekomendasi itinerary. Setiap requirement adalah testable dan terukur. Sistem ini terintegrasi seamless: pengguna login → sistem menangkap lokasi real-time → AI memberikan rekomendasi destinasi berdasarkan jarak dan preferensi.

Target Users: Pengunjung umum website Magelang yang ingin mengeksplorasi destinasi wisata, budaya, dan kuliner.

## Glossary

- **JWT (JSON Web Token)**: Token berbasis JSON untuk autentikasi dan otorisasi pengguna
- **Haversine Formula**: Algoritma perhitungan jarak antar dua titik geografis
- **TOTP (Time-based One-Time Password)**: Metode 2FA berbasis waktu untuk verifikasi pengguna
- **Geolocation**: Penentuan lokasi geografis pengguna berbasis GPS atau WiFi
- **Itinerary**: Rencana perjalanan dengan daftar destinasi, waktu, dan urutan kunjungan
- **AI Assistant**: Sistem rekomendasi berbasis artificial intelligence (OpenAI GPT)

## Requirements

### Requirement 1: User Registration dengan Email & Password

**User Story:** As a new user, I want to create an account with email and password so that I can save my preferences and access the application.

#### Acceptance Criteria

1. User dapat input email dan password di halaman registrasi
2. System SHALL validate email format (RFC 5322) and reject format invalid dengan HTTP 400
3. System SHALL validate password strength:
   - Minimum 8 karakter
   - Mengandung uppercase (A-Z)
   - Mengandung lowercase (a-z)
   - Mengandung digit (0-9)
   - Mengandung special character (!@#$%^&*)
4. System SHALL validate email belum terdaftar (unique constraint) and reject duplicate dengan HTTP 409
5. System SHALL hash password dengan bcrypt (min 10 rounds) sebelum disimpan ke database
6. System SHALL return HTTP 201 Created dengan user object (tanpa password) pada successful registration
7. System SHALL return HTTP 409 Conflict dengan error message pada duplicate email
8. System SHALL return HTTP 400 Bad Request dengan validation errors pada invalid input

---

### Requirement 2: User Login dengan JWT Authentication

**User Story:** As a registered user, I want to login with email and password to access my personalized dashboard and recommendations.

#### Acceptance Criteria

1. User dapat input email & password di login form
2. System SHALL query user by email dari database
3. System SHALL verify password menggunakan bcrypt.compare()
4. System SHALL return HTTP 200 OK dengan response pada successful login:
   - token (JWT access token)
   - refreshToken (JWT refresh token)
   - user object (id, email, name)
   - expiresIn (900 seconds)
5. System SHALL sign JWT token dengan RS256 atau HS256 algorithm
6. System SHALL include userId, email, iat (issued at), exp (expiration) dalam JWT claims
7. System SHALL set JWT token expiration ke 15 minutes (900 seconds)
8. System SHALL set refresh token expiration ke 7 days
9. System SHALL return HTTP 401 Unauthorized pada invalid credentials
10. System SHALL enforce rate limiting: max 5 login attempts per 15 minutes per IP
11. System SHALL lock account untuk 15 minutes after 5 failed attempts
12. System SHALL send security alert email setelah 3+ failed attempts

---

### Requirement 3: 2FA (Two-Factor Authentication) dengan TOTP

**User Story:** As a security-conscious user, I want to enable two-factor authentication to protect my account from unauthorized access.

#### Acceptance Criteria

1. User dapat enable 2FA di settings page
2. System SHALL generate QR code untuk authenticator app (Google Authenticator, Authy, etc)
3. System SHALL generate secret key (base32 encoded) dan tampilkan di QR code
4. User dapat scan QR code dan verify dengan 6-digit TOTP code
5. System SHALL validate TOTP code accept current window (±30 seconds)
6. System SHALL store used codes untuk prevent replay attacks
7. System SHALL require TOTP verification setiap login setelah 2FA enabled
8. System SHALL generate 8 backup codes jika 2FA enabled
9. User dapat disable 2FA dengan password confirmation
10. System SHALL restrict maximum 3 failed TOTP attempts per login session

---

### Requirement 4: Token Management (Access & Refresh)

**User Story:** As a user, I want my session tokens to be managed securely so that I can stay logged in safely across multiple requests.

#### Acceptance Criteria

1. System SHALL set access token expiration ke 15 minutes
2. System SHALL set refresh token expiration ke 7 days
3. User dapat refresh expired access token menggunakan refresh token
4. System SHALL accept POST /api/auth/refresh dengan refresh token di body
5. System SHALL return new access token dan new refresh token (token rotation) pada valid refresh
6. System SHALL return HTTP 401 Unauthorized pada invalid/expired refresh token
7. System SHALL allow token revocation (logout) dan invalidate setelahnya
8. System SHALL store refresh tokens di database dengan userId untuk audit
9. System SHALL restrict maximum 10 active refresh tokens per user (oldest revoked)

---

### Requirement 5: User Profile Management

**User Story:** As a user, I want to manage my profile information to keep my account details current and accurate.

#### Acceptance Criteria

1. System SHALL provide GET /api/users/profile (authenticated) endpoint
2. System SHALL return user profile dengan: id, email, name, avatar, bio, createdAt
3. System SHALL provide PUT /api/users/profile (authenticated) endpoint
4. System SHALL accept name (2-100 chars), avatar URL valid, bio (0-500 chars)
5. System SHALL return updated user object upon successful update
6. System SHALL restrict profile update hanya untuk authenticated user own profile
7. System SHALL require JWT token di Authorization header
8. System SHALL persist profile changes immediately ke database

---

### Requirement 6: User Preferences Management

**User Story:** As a user, I want to set my travel preferences so that recommendations are personalized to my interests and constraints.

#### Acceptance Criteria

1. System SHALL provide GET /api/users/preferences (authenticated) endpoint
2. System SHALL return preferences: interests, budgetLevel, mobilityLevel, language, maxSpendPerDay, distancePreference
3. System SHALL provide PUT /api/users/preferences (authenticated) endpoint
4. System SHALL validate interests dari predefined list: nature, culture, food, history, adventure
5. System SHALL validate budgetLevel: 'budget', 'moderate', or 'premium'
6. System SHALL validate mobilityLevel: 1-10 scale
7. System SHALL validate maxSpendPerDay >= 0
8. System SHALL validate distancePreference >= 0 (km)
9. System SHALL initialize preferences on first login dengan default values
10. System SHALL persist preference updates immediately

---

### Requirement 7: Password Reset

**User Story:** As a user who forgot my password, I want to reset it via email so that I can regain access to my account.

#### Acceptance Criteria

1. System SHALL provide POST /api/auth/forgot-password endpoint (no auth required)
2. System SHALL accept email parameter
3. IF email exists: System SHALL send reset link via email (valid 1 hour)
4. System SHALL return HTTP 200 "Check your email for reset link" regardless of email existence (prevent user enumeration)
5. System SHALL include secure token, userId, expiration dalam reset link
6. System SHALL provide POST /api/auth/reset-password endpoint (no auth required)
7. System SHALL accept token dan newPassword parameters
8. System SHALL validate token not expired
9. System SHALL validate new password strength rules
10. System SHALL hash new password dengan bcrypt sebelum update
11. System SHALL invalidate all existing refresh tokens (force re-login on all devices)
12. System SHALL return HTTP 200 "Password reset successful" pada valid reset

---

### Requirement 8: Get Current User Location

**User Story:** As a user, I want the system to capture my real-time location so that I can see nearby destinations on the map.

#### Acceptance Criteria

1. Frontend SHALL request browser geolocation permission saat user login
2. IF permission granted: System SHALL capture latitude, longitude, accuracy
3. System SHALL provide POST /api/locations/update (authenticated) endpoint
4. System SHALL accept latitude, longitude, accuracy, timestamp dalam request
5. System SHALL validate lat in [-90, 90], lng in [-180, 180], accuracy >= 0
6. System SHALL create atau update UserLocation record untuk user
7. System SHALL return HTTP 200 dengan location object
8. IF permission denied: System SHALL show UI prompt untuk enable in browser settings
9. System SHALL provide fallback untuk manual address/location input
10. System SHALL always set location timestamp ke UTC current time

---

### Requirement 9: Get Latest User Location

**User Story:** As a user, I want to retrieve my current location from the system so that recommendations can be based on where I am right now.

#### Acceptance Criteria

1. System SHALL provide GET /api/locations/current (authenticated) endpoint
2. System SHALL return latest UserLocation untuk authenticated user
3. System SHALL include id, userId, latitude, longitude, accuracy, timestamp dalam response
4. System SHALL format timestamp dalam ISO 8601 format
5. IF no location history: System SHALL return HTTP 404 dengan message "No location data available"
6. System SHALL achieve response time < 100ms (dengan caching)
7. System SHALL restrict access hanya untuk authenticated user own location

---

### Requirement 10: Calculate Distance to Destination

**User Story:** As a user, I want to see the distance from my current location to tourist destinations so that I can plan my visits accordingly.

#### Acceptance Criteria

1. System SHALL implement Haversine formula untuk great-circle distance calculation
2. System SHALL provide GET /api/locations/distance?destId={destinationId} (authenticated) endpoint
3. System SHALL accept destinationId query parameter
4. System SHALL get user current location dari database
5. System SHALL get destination coordinates
6. System SHALL calculate distance menggunakan Haversine formula
7. System SHALL return distance dalam km dengan estimatedTravelTime dalam minutes
8. System SHALL achieve Haversine calculation accuracy ke ±0.01 km
9. System SHALL ensure distance calculation symmetric: dist(A→B) ≈ dist(B→A)
10. System SHALL cache distance results untuk 5 minutes per user-destination pair

---

### Requirement 11: Get Nearby Destinations

**User Story:** As a user, I want to find tourist destinations near me so that I can easily discover attractions within reach.

#### Acceptance Criteria

1. System SHALL provide GET /api/destinations/nearby?radius=5&limit=10 (authenticated) endpoint
2. System SHALL accept radius (km, default 5) dan limit (default 10) query parameters
3. System SHALL get user current location
4. System SHALL query all Tourism destinations
5. System SHALL calculate distance ke setiap destination
6. System SHALL filter destinations dengan distance <= radius
7. System SHALL sort results by distance ascending
8. System SHALL return maksimal `limit` destinations
9. System SHALL include destination id, name, category, latitude, longitude, distance, estimatedTravelTime, rating
10. System SHALL validate radius parameter 0.5-50 km
11. System SHALL validate limit parameter 1-100
12. System SHALL achieve response time < 200ms

---

### Requirement 12: Display Map dengan Real-Time User Position

**User Story:** As a user, I want to see an interactive map showing my position and nearby tourist destinations so that I can visualize the area.

#### Acceptance Criteria

1. Frontend SHALL use Leaflet.js + OpenStreetMap tiles untuk map rendering
2. System SHALL initialize map centered on Magelang city (7.4728°S, 110.2122°E)
3. System SHALL add user location marker (blue dot) dengan accuracy circle
4. System SHALL auto-update user marker setiap 5-10 detik
5. System SHALL add destination markers (red pins) dengan name, category, distance info
6. System SHALL provide click handler untuk destination marker
7. System SHALL zoom level smart-adjust based on user interactions
8. System SHALL be mobile responsive (full-screen map on mobile)
9. System SHALL support touch/tap interactions pada mobile
10. System SHALL include map controls: zoom, center, fullscreen buttons

---

### Requirement 13: Location History & Privacy

**User Story:** As a user, I want my location history to be private and automatically deleted after a certain period so that my privacy is protected.

#### Acceptance Criteria

1. System SHALL store all location updates ke UserLocation table
2. System SHALL provide GET /api/locations/history?limit=50&days=7 endpoint
3. System SHALL return UserLocation records array, newest first
4. System SHALL validate limit parameter 1-100, default 50
5. System SHALL validate days parameter untuk filter last N days
6. System SHALL implement data retention policy:
   - Keep raw data 30 days
   - After 30 days: anonymize (round coordinates to 100m precision)
   - After 90 days: delete
7. User dapat request delete all location history: DELETE /api/locations/history
8. System SHALL perform soft delete dengan flag isDeleted: true
9. System SHALL create audit log entry pada deletion
10. System SHALL require explicit user consent untuk location tracking

---

### Requirement 14: Proximity-Based Destination Scoring

**User Story:** As a user, I want destinations to be ranked by how well they match my interests and proximity so that I see the best recommendations first.

#### Acceptance Criteria

1. System SHALL provide GET /api/recommendations/score?limit=10 (authenticated) endpoint
2. System SHALL get user location dan preferences
3. System SHALL query all tourism destinations
4. FOR each destination System SHALL calculate composite score (0-100):
   - Distance score (30%): closer = higher
   - Category relevance (35%): match user interests
   - Rating score (20%): destination rating/5 * 20
   - Budget compatibility (15%): based on price range
   - Accessibility (10%): based on mobility level
5. System SHALL filter destinations dengan distance <= maxDistance from preferences
6. System SHALL sort by score descending
7. System SHALL return top `limit` destinations dengan score breakdown
8. System SHALL ensure score calculation deterministic (same inputs = same score)
9. System SHALL cache recommendations untuk 30 menit per user
10. System SHALL achieve response time < 200ms

---

### Requirement 15: Generate AI Itinerary

**User Story:** As a user, I want to generate a personalized itinerary based on my location and preferences so that I have a planned schedule for my visit.

#### Acceptance Criteria

1. System SHALL provide POST /api/ai/generate-itinerary (authenticated) endpoint
2. System SHALL accept duration (hours), startTime, interests[], budget dalam request
3. System SHALL validate duration > 0, budget > 0, interests non-empty
4. System SHALL call RecommendationService untuk top destinations
5. System SHALL use greedy algorithm untuk select destinations fitting time & budget
6. System SHALL generate itinerary dengan minimum 2 destinations (if possible)
7. System SHALL generate itinerary dengan maximum 6-8 destinations based on duration
8. FOR each destination System SHALL include: start time, end time, stay duration, travel time
9. System SHALL call OpenAI API (GPT-4) untuk generate natural language summary
10. System SHALL return response dengan itinerary items, totalDistance, totalCost, summary, tips
11. System SHALL validate total time <= duration, total cost <= budget
12. System SHALL store itinerary ke SavedItinerary table
13. System SHALL achieve response time < 3 seconds
14. System SHALL handle edge cases:
    - No destinations available → HTTP 404
    - Insufficient time → suggest single destination
    - Zero budget → use cheapest options

---

### Requirement 16: Save & Retrieve Itinerary

**User Story:** As a user, I want to save generated itineraries so that I can reference them later and track my visits.

#### Acceptance Criteria

1. System SHALL provide POST /api/itineraries (authenticated) endpoint
2. System SHALL accept title, description, itinerary_items dalam request
3. System SHALL store SavedItinerary record ke database
4. System SHALL return HTTP 201 Created dengan itinerary object
5. System SHALL provide GET /api/itineraries (authenticated) endpoint
6. System SHALL return array of SavedItinerary untuk authenticated user
7. System SHALL sort results newest first
8. System SHALL include id, title, createdAt, duration, cost, isCompleted
9. System SHALL provide GET /api/itineraries/{id} (authenticated) endpoint
10. System SHALL return full itinerary details dengan all items
11. System SHALL restrict access hanya untuk owner
12. System SHALL provide DELETE /api/itineraries/{id} (authenticated) endpoint
13. System SHALL perform soft delete (set isDeleted: true)
14. System SHALL restrict delete hanya untuk owner
15. System SHALL provide PUT /api/itineraries/{id} (authenticated) endpoint
16. System SHALL allow update title, description, rating, feedback
17. System SHALL allow mark itinerary as completed

---

### Requirement 17: AI Insights untuk Destinasi

**User Story:** As a user, I want to see AI-generated tips and insights about each destination so that I can make better decisions about what to visit.

#### Acceptance Criteria

1. System SHALL provide GET /api/ai/destination-insights/{destinationId} (authenticated) endpoint
2. System SHALL call OpenAI API dengan destination context
3. System SHALL return tips (array of strings)
4. System SHALL return bestTimeToVisit (string)
5. System SHALL return localRecommendations (array of strings)
6. System SHALL return historicalInfo (string)
7. System SHALL return estimatedVisitTime (minutes)
8. System SHALL cache response untuk 24 hours
9. System SHALL handle OpenAI errors gracefully dengan fallback

---

### Requirement 18: Recommendation Quality Metrics

**User Story:** As a user, I want to provide feedback on recommendations so that the system can improve its suggestions over time.

#### Acceptance Criteria

1. System SHALL provide POST /api/itineraries/{id}/rate (authenticated) endpoint
2. System SHALL accept rating (1-5) dan feedback (string) dalam request
3. System SHALL validate rating 1-5
4. System SHALL store rating dan feedback ke SavedItinerary table
5. System SHALL use metrics untuk adjust scoring weights
6. System SHALL calculate recommendation acceptance rate
7. System SHALL calculate average user rating per recommendation
8. System SHALL calculate follow-through rate (did user actually visit)

---

### Requirement 19: Authentication Flow Integration

**User Story:** As a user, I want a seamless experience from login through to receiving recommendations so that my journey feels cohesive.

#### Acceptance Criteria

1. AFTER successful login System SHALL:
   - Store JWT token in httpOnly cookie
   - Request geolocation permission
   - Send location to backend
   - Navigate to /smart-map page
2. System SHALL display user position on map
3. System SHALL unauthenticated requests redirect ke login page
4. System SHALL provide session management:
   - Token auto-refresh 2 minutes before expiration
   - Logout: clear cookie, invalidate refresh token
   - Token expiration: auto-redirect ke login

---

### Requirement 20: Real-Time Location Updates

**User Story:** As a user, I want my location to update continuously so that recommendations stay current as I move.

#### Acceptance Criteria

1. System SHALL update location on-demand saat user buka map/recommendation page
2. System SHALL update location background setiap 5-10 menit (configurable)
3. User dapat disable background tracking in preferences
4. System SHALL NOT block UI untuk location updates (background task)
5. System SHALL batch multiple pending updates sebelum send ke backend
6. System SHALL reduce frequency on low battery (device-aware)
7. System SHALL stop all background tracking on logout

---

## Non-Functional Requirements

### Requirement 21: Security

**User Story:** As a user, I want my personal data and credentials to be protected so that my account and privacy are secure.

#### Acceptance Criteria

1. System SHALL hash all passwords dengan bcrypt (≥10 rounds)
2. System SHALL sign JWT tokens dengan RS256 atau HS256
3. System SHALL enforce rate limiting: 5 login attempts/15min per IP
4. System SHALL ONLY use HTTPS (no HTTP)
5. System SHALL configure CORS to whitelist trusted origins
6. System SHALL prevent SQL injection menggunakan Prisma ORM
7. System SHALL prevent XSS dengan input sanitization dan CSP headers
8. System SHALL implement CSRF protection (SameSite cookies)
9. System SHALL anonymize location data after 30 days
10. System SHALL implement audit logging untuk sensitive operations
11. System SHALL generate password reset tokens dengan CSPRNG dengan 1-hour expiration

---

### Requirement 22: Performance

**User Story:** As a user, I want the application to respond quickly so that the experience is smooth and enjoyable.

#### Acceptance Criteria

1. System SHALL achieve login response < 500ms (p99)
2. System SHALL achieve get nearby destinations response < 200ms (cached)
3. System SHALL achieve generate itinerary response < 3s (includes LLM)
4. System SHALL achieve map rendering initial load < 1s
5. System SHALL achieve position update < 100ms
6. System SHALL maintain cache hit rate > 80%
7. System SHALL support database connection pool: 10 connections
8. System SHALL support max concurrent users: 1000

---

### Requirement 23: Reliability

**User Story:** As a user, I want the system to be consistently available so that I can rely on it when planning my visits.

#### Acceptance Criteria

1. System SHALL maintain 99.5% uptime SLA
2. System SHALL perform daily database snapshots, retain 30 days
3. System SHALL have disaster recovery RTO < 1 hour, RPO < 15 minutes
4. System SHALL function gracefully even IF AI unavailable (fallback to rule-based)
5. System SHALL retry automatic dengan exponential backoff on errors

---

### Requirement 24: Usability

**User Story:** As a user, I want an intuitive interface that works on my phone so that I can use the app anywhere.

#### Acceptance Criteria

1. System SHALL be mobile responsive design (iOS 12+, Android 8+)
2. System SHALL comply with WCAG 2.1 AA accessibility standards
3. System SHALL show loading indicators untuk async operations
4. System SHALL provide clear error messages
5. System SHALL show confirmation dialogs untuk destructive actions
6. System SHALL support dark mode (optional)

---

### Requirement 25: Privacy & Compliance

**User Story:** As a user, I want my privacy to be respected and my data to be handled according to regulations so that I feel safe using this service.

#### Acceptance Criteria

1. System SHALL be GDPR compliant (user consent, data export, deletion)
2. System SHALL clearly display privacy policy
3. System SHALL require user consent untuk location tracking
4. System SHALL limit location data retention ke maximum 90 days
5. System SHALL support right to be forgotten: delete all user data
6. System SHALL require acceptance of Terms of Service on registration
