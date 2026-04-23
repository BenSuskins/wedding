# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                    # Dev server
pnpm build                  # Production build
pnpm typecheck              # TypeScript check
pnpm lint                   # ESLint
pnpm test                   # Unit tests (vitest)
pnpm test:watch             # Unit tests in watch mode
pnpm test:contract          # Contract tests (Testcontainers + real Postgres)
pnpm e2e                    # Playwright E2E tests
pnpm db:generate            # Regenerate Prisma client after schema changes
pnpm db:migrate             # Create + apply migration (dev)
pnpm db:migrate:deploy      # Apply migrations (prod)
docker compose up db        # Local Postgres only
```

Environment: copy `.env.example` to `.env.local`; required vars are `DATABASE_URL`, `INVITE_TOKEN_SECRET`, `AUTH_SECRET`, and three Authelia OIDC vars.

## Architecture

Next.js 15 App Router, TypeScript, Prisma ORM with `@prisma/adapter-pg`, PostgreSQL, Auth.js (OIDC via Authelia). Packaged as a Docker standalone build.

### Edge / Node split

The single most important invariant: **middleware runs on the Edge runtime and must never import Prisma**. Every page and route handler that touches Prisma has `export const runtime = "nodejs"`. The lean `auth.config.ts` (Edge-safe) is kept separate from `server/auth.ts` (Node-only, contains the Prisma `AdminUser` upsert). Maintain this split when adding routes.

### Key patterns

**Result types.** All lib functions return `Result<T, E>` or `ResultAsync<T, E>` via `neverthrow`. Error kinds are discriminated unions (`{ kind: "not_found" }`, `{ kind: "deadline_passed" }`, etc.). The `src/lib/result.ts` module adds Zod-integration helpers on top. Never throw from lib code; return errors.

**Invite tokens.** `src/lib/invite-token.ts` implements `base64url(inviteId).base64url(tokenVersion).base64url(hmac-sha256-sig)`. Bumping `tokenVersion` on the `Invite` row invalidates all guest links immediately without touching guest data. A `createFakeInviteTokenSigner()` and a shared contract suite (`tests/unit/invite-token.contract.ts`) keep the real and fake implementations in sync.

**Three-tier tests.**
- Unit (`tests/unit/`, vitest, no DB): pure logic — countdown, rate limiter, token, CSV.
- Contract (`tests/contract/`, vitest + Testcontainers): real Postgres spun per-run; tests DB queries and route handler logic. Timeout is 120 s; pool is `forks`.
- E2E (`tests/e2e/`, Playwright): full browser against a running Next.js dev server.

**Bilingual content.** English and French content blocks are stored as separate `ContentBlock` keys (e.g. `"travel"` / `"travel_fr"`). Components receive both as props and toggle client-side via `language-toggle.tsx`. Site-wide tunable values (dates, image paths) live in `SiteSetting` JSON blobs rather than code.

**In-memory rate limiter.** `src/lib/rsvp/rate-limit.ts` is a token-bucket backed by a plain `Map`. It accepts a `Clock` interface for deterministic testing with a fake. It resets on restart — acceptable for a single-instance site.

**Audit log.** `RsvpAuditLog` is append-only; the DB role has UPDATE/DELETE revoked at the database level, not enforced in app code alone.

### Data model

`Invite` → one or more `Guest` records under one shareable RSVP link. `InviteEventAllowance` is the junction controlling which events an invite can RSVP to. `Event` → `MenuCourse` → `MenuOption`. `RsvpResponse` is per-guest per-event (unique constraint). Admin identity is mirrored from OIDC subjects into `AdminUser` for stable audit references; all authorization is delegated to Authelia (any authenticated subject is admin).
