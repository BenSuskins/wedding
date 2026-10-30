# syntax=docker/dockerfile:1.6

FROM oven/bun:1.4.2-alpine AS bun

FROM node:22-alpine AS base
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,id=bun-cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Self-contained Prisma CLI for running migrations at startup.
FROM oven/bun:1.4.2-alpine AS prisma-cli
WORKDIR /opt/prisma-cli
RUN bun add --exact --no-save prisma@7.7.0

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NODE_PATH=/app/prisma-cli/node_modules

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder    --chown=nextjs:nodejs /app/public             ./public
COPY --from=builder    --chown=nextjs:nodejs /app/.next/standalone   ./
COPY --from=builder    --chown=nextjs:nodejs /app/.next/static       ./.next/static
COPY --from=builder    --chown=nextjs:nodejs /app/prisma             ./prisma
COPY --from=builder    --chown=nextjs:nodejs /app/prisma.config.ts   ./prisma.config.ts
# Keep the prisma CLI in its own prefix to avoid clobbering the Next standalone
# node_modules tree. The entrypoint invokes prisma by absolute path, and
# NODE_PATH exposes its deps (prisma/config, effect, ...) to prisma.config.ts.
COPY --from=prisma-cli --chown=nextjs:nodejs /opt/prisma-cli         /app/prisma-cli
COPY --chown=nextjs:nodejs docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/healthz >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
