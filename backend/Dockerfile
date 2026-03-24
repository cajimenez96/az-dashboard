# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Runner
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# 🔥 FIX: necesario para healthcheck y compatibilidad Prisma
RUN apk add --no-cache curl openssl

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY package*.json ./

# Prisma generate again (safety)
RUN npx prisma generate

EXPOSE 3000

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1