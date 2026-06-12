FROM node:20-bookworm-slim

WORKDIR /app

# Prisma is more reliable on Debian slim than Alpine for Railway builds.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy Prisma schema before install so package postinstall can generate client.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
