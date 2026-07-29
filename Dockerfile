# syntax=docker/dockerfile:1
# LibAmbassyFR — image de production (Next.js 15 + Prisma/SQLite)

# ---------- 1. dépendances complètes (build) ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---------- 2. build ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL factice : `next build` ne se connecte pas, mais Prisma exige la variable.
ENV DATABASE_URL="file:/tmp/build.db"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 3. runtime ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7100
ENV HOSTNAME=0.0.0.0
# Emplacements persistants (montés en volume par docker-compose)
ENV DATABASE_URL="file:/data/app.db"
ENV UPLOAD_DIR="/data/uploads"

# Dépendances de production uniquement (prisma CLI inclus : il est en `dependencies`,
# nécessaire pour `prisma generate` en postinstall et `prisma db push` au démarrage).
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY next.config.mjs ./
COPY content ./content
COPY deploy/entrypoint.sh deploy/seed-if-empty.mjs ./deploy/
RUN chmod +x deploy/entrypoint.sh && mkdir -p /data/uploads

EXPOSE 7100
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:7100/ >/dev/null || exit 1

ENTRYPOINT ["./deploy/entrypoint.sh"]
