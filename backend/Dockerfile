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

# ✅ necesario para prisma + healthchecks
RUN apk add --no-cache curl openssl

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY package*.json ./

# regenerar prisma en runtime (correcto)
RUN npx prisma generate

EXPOSE 3000

# (opcional pero recomendado)
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]