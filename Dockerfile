# syntax=docker/dockerfile:1.7
# Production image for Listiq. Used by docker-compose.yml for one-command local runs.

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM deps AS build
COPY . .
# Build-time placeholders only; real values are injected at runtime.
ENV SESSION_SECRET=build-time-placeholder-secret-not-used-at-runtime \
    DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app ./
EXPOSE 3000
# Apply pending migrations, then serve the app.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
