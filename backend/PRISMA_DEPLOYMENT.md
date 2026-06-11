Prisma Deployment Guide

1. Install dependencies
   npm install

2. Generate Prisma client
   npx prisma generate

3. Run migrations (development)
   npx prisma migrate dev --name init

4. Deploy migrations (production)
   npx prisma migrate deploy

5. Set environment variables
   - DATABASE_URL (must point to your Postgres/MySQL DB)
   - JWT_SECRET
   - REDIS_URL (optional)
   - OPENAI_API_KEY (optional)

6. Run seed (optional)
   node scripts/run-seed.js

7. Start server
   npm run start

Notes:
- In CI/CD, run `npx prisma generate` before building.
- For serverless environments, ensure `prisma/schema.prisma` `datasource` uses a connection string compatible with the platform and connection pooling if necessary.

Railway / Production notes
-------------------------

- Set environment variables in Railway project settings:
   - `DATABASE_URL` (Postgres or MySQL connection string)
   - `JWT_SECRET`
   - `REDIS_URL` (optional)
   - `OPENAI_API_KEY` (optional)

- Recommended Railway build steps (example `Start Command` or a Railway plugin):
   1. `npm ci`
   2. `npx prisma generate`
   3. `npx prisma migrate deploy`
   4. `npm run build`
   5. `npm start`

- Use the Railway Postgres add-on and expose `DATABASE_URL` to the app. For connection pooling, use a connection pooler or configure the Prisma `datasource` with `url` pointing to the pooler.

- Running seed after deploy (only when safe):
   - You can run `node scripts/run-seed.js` once after deploy to populate default categories and sample content. Ensure the deploy environment has an admin user or use a short-lived developer token.

- Troubleshooting:
   - If migrations fail, inspect `npx prisma migrate status` locally and ensure the `DATABASE_URL` has proper permissions.
   - Run `npx prisma studio` locally with the same `DATABASE_URL` for quick inspection.

