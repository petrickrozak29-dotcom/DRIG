# Deployment Guide

This file explains how to deploy the `frontend` (Next.js) and `backend` (Express + Prisma).

Prerequisites
- A production Postgres database and its `DATABASE_URL` value
- Project secrets: `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, `S3_*` values, `OPENAI_API_KEY`, `REDIS_URL`

Frontend (Vercel)
1. Create a Vercel project and connect your GitHub repository.
2. Set `NEXT_PUBLIC_API_URL` to your backend URL in Vercel project settings.
3. Deploy by pushing to `main` or run `npx vercel --prod` inside `frontend/`.

Backend (Railway or Docker)
Railway (recommended for quick deploy):
1. Create a Railway project and add a Postgres plugin.
2. Add environment variables in Railway with the keys above.
3. Use Railway GitHub integration or run the manual deploy workflow in GitHub Actions.

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
1. On the production host or CI runner, run `npx prisma migrate deploy` before starting the backend to apply migrations safely.

GitHub Actions
- A manual `Manual Deploy` workflow was added at `.github/workflows/deploy.yml` that builds both projects and supports Vercel and Railway deploys (requires repository Secrets).

If you want, I can prepare the exact Secrets list and a checklist to paste into GitHub settings, or help you run the manual workflow once you set the secrets.
