# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy standalone build + static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for migrate deploy at startup
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
