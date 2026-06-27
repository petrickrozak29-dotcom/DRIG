# Deployment Guide

This file explains how to deploy the `frontend` (Next.js) and `backend` (Express + Prisma).

Prerequisites
- A production Postgres database and its `DATABASE_URL` value
- Project secrets: `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, `CORS_ORIGINS`, `S3_*` values, `OPENAI_API_KEY`, `REDIS_URL`

Frontend (Vercel)
1. Create a Vercel project and connect your GitHub repository.
2. Set `NEXT_PUBLIC_API_URL` to your backend URL in Vercel project settings.
3. Deploy by pushing to `main` or run `npx vercel --prod` inside `frontend/`.

Backend (Railway or Docker)
Railway (recommended for quick deploy):
1. Create a Railway project and add a Postgres database.
2. Set the service root directory to `backend`.
3. Add environment variables in Railway with the keys above.
   For CORS, set `CORS_ORIGINS` to your frontend HTTPS origin, for example `https://magelangverse.vercel.app`.
4. Deploy from GitHub. `backend/railway.json` tells Railway to run `npm run start`.

Docker (self-host):
1. Build the image:
```
docker build -t magelangverse-backend:latest -f backend/Dockerfile backend/
```
2. Run container with env vars:
```
docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 4000:4000 magelangverse-backend:latest
```

Prisma migrations in production
1. The current production start command runs `prisma db push` before `node dist/index.js`, so Railway will sync the schema on startup.
2. For stricter production migration control later, change `backend/package.json` start to run `prisma migrate deploy` instead.

GitHub Actions
- A manual `Manual Deploy` workflow was added at `.github/workflows/deploy.yml` that builds both projects and supports Vercel and Railway deploys (requires repository Secrets).

If you want, I can prepare the exact Secrets list and a checklist to paste into GitHub settings, or help you run the manual workflow once you set the secrets.
