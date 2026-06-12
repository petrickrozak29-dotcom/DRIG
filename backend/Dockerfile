FROM node:20-alpine

WORKDIR /app

# Install dependencies (including dev deps for build)
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# Generate Prisma client
RUN npm run prisma:generate || true

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/index.js"]
