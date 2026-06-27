Deployment checklist for MAGELANGVERSE-ID

GitHub
- Push the repository to GitHub.
- Keep `.env` files out of git. Use `backend/.env.example` and `frontend/.env.example` as templates.

Railway Backend
- Project root: `backend`
- Start command: `npm run start`
- Required variables:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `NODE_ENV=production`
  - `CORS_ORIGINS=https://your-vercel-app.vercel.app`
- Optional variables:
  - `OPENAI_API_KEY`
  - `REDIS_URL`
  - `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_PUBLIC_URL`
- After deploy, open `https://your-railway-backend/api/health`.

Vercel Frontend
- Project root: `frontend`
- Build command: `npm run build`
- Output directory: leave default for Next.js
- Required variable:
  - `NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app`

Storage
- If S3 variables are configured, uploaded images use object storage.
- If S3 is not configured, uploaded images are saved as data URLs so photos still persist after Railway redeploys.

Post-Deploy Checks
- Open `/`, `/wisata`, `/kuliner`, `/budaya`, `/sejarah`, `/event`, `/smart-map`, and `/smart-magelang`.
- Submit one community item with a Google Maps link or coordinates.
- Approve it from Developer Dashboard.
- Confirm it appears with the uploaded photo in the relevant feature page, Smart Map, and AI itinerary recommendations.
