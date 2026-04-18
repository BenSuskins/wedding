# syntax=docker/dockerfile:1.6

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Self-contained prisma CLI for running migrations at startup.
# pnpm's symlink layout doesn't survive a COPY, so install the CLI with
# plain npm into an isolated prefix.
FROM node:22-alpine AS prisma-cli
RUN mkdir -p /opt/prisma-cli \
 && cd /opt/prisma-cli \
 && npm init -y >/dev/null \
 && npm install --omit=optional --no-audit --no-fund prisma@7.7.0

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder    --chown=nextjs:nodejs /app/public             ./public
COPY --from=builder    --chown=nextjs:nodejs /app/.next/standalone   ./
COPY --from=builder    --chown=nextjs:nodejs /app/.next/static       ./.next/static
COPY --from=builder    --chown=nextjs:nodejs /app/prisma             ./prisma
COPY --from=builder    --chown=nextjs:nodejs /app/prisma.config.ts   ./prisma.config.ts
# Merge the prisma CLI's node_modules tree into the app's so prisma.config.ts
# can resolve `prisma/config` and its transitive deps (effect, etc.) at startup.
COPY --from=prisma-cli --chown=nextjs:nodejs /opt/prisma-cli/node_modules/ ./node_modules/
COPY --chown=nextjs:nodejs docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/healthz >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
