FROM node:22-alpine

WORKDIR /app

# Install system deps Prisma needs
RUN apk add --no-cache libc6-compat openssl

# Copy package manifests first (better layer cache)
COPY package.json package-lock.json* ./

# Install all deps (dev+prod) for build
RUN npm ci

# Copy prisma + generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy rest of source
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Optional: prune dev deps to slim down a little
RUN npm prune --omit=dev

# Data dir for SQLite (or mount in Compose)
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Run migrations on start, then launch Next.js
CMD sh -c "npx prisma migrate deploy && npm run start"

