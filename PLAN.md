# Wedding Website — Implementation Plan

## Context

Ben is building a wedding website for a wedding **3–6 months out**. The site has two user-facing jobs and one admin job:

1. **Public informational site** — schedule, venues, travel, dress code, FAQ, gift registry. Publicly reachable, no auth.
2. **Private RSVP** — guests reach it via a **unique signed invite link per invite**, submit menu selections + allergies + song request, editable until a hard deadline.
3. **CMS-style admin UI** — Ben edits all content and views/exports RSVPs. Authenticated against his existing **self-hosted Authelia** over OIDC.

The single biggest risk flagged by the user is **data loss / RSVP reliability**. The design prioritises durability, an append-only audit log, and CSV export correctness over feature breadth.

Aesthetic direction: **elegant/editorial** (serif, whitespace, photography).

## Decisions captured from interview

| Area | Decision |
|---|---|
| Admin SSO | Authelia via OIDC |
| Guest auth | Signed invite link per invite, long-lived, rotatable per invite |
| Content storage | Database, edited via admin UI (true CMS) |
| RSVP unit | Per-invite toggle: household OR individual |
| Plus-ones | Per-invite toggle: fixed named list OR allow guest to add +1 |
| Events | Multi-event with tiered invites (per-invite allowlist) |
| Menu model | Course options + free-text allergies |
| Kids | Not modelled |
| Guest edits | Editable until hard deadline, then read-only |
| Deadline | Hard lock enforced server-side |
| Notifications | None. Admin UI is the only surface |
| Editorial workflow | Just Ben, direct publish (with audit log) |
| Guest list entry | Manual, one household at a time |
| Reporting | CSV export with menu + allergies |
| Site privacy | Public everything except RSVP |
| Extra RSVP fields | Song request only |
| Locale | Single country, single timezone, English |
| Hosting | Self-hosted on existing Docker/k8s infra |
| Images | Local Docker volume (mounted, backed up separately) |
| Testing | Full TDD — fakes for boundaries, contract tests against real Postgres |

## Tech stack (recommendation with justification)

- **Next.js 15 (App Router) + TypeScript** — server actions suit RSVP + CMS form flows; SSR suits the editorial public site; mature OIDC ecosystem (Auth.js). Ships as a single container, fits Docker/k8s cleanly.
- **Postgres 16** — the RSVP audit log, tiered invites, and CMS content all benefit from relational integrity. Hosted in-cluster.
- **Prisma** — schema + migrations + typed queries. Prisma's test patterns fit the user's "fake at the boundary, contract-test the real DB" preference.
- **Auth.js (NextAuth v5)** — Authelia OIDC provider for admin only. Guest RSVP does **not** use Auth.js; it uses HMAC-signed invite tokens.
- **Zod + neverthrow** — validation + Result-style return values, matching the user's "result style programming rather than throwing" preference.
- **Tailwind + shadcn/ui** for the admin UI. **Hand-rolled editorial CSS** (custom serif stack, photographic hero) for the public site; shadcn would fight the intended aesthetic there.
- **Vitest** for unit + contract tests; **Playwright** for end-to-end; **Testcontainers (pg)** for integration tests in CI.

Reasons to reject alternatives: SvelteKit has thinner OIDC tooling; Astro's form story is weaker for the CMS surface; a split static-site + API would duplicate routing and deploy.

## Architecture overview

```
┌──────────── public site ─────────────┐    ┌──────────── admin UI ──────────────┐
│  /, /schedule, /travel, /faq, /gifts │    │  /admin (Auth.js + Authelia OIDC)   │
│  /rsvp/[token] (guest RSVP)          │    │  /admin/guests, /admin/events, ...  │
└──────────┬───────────────────────────┘    └──────────┬──────────────────────────┘
           │                                           │
           └──────────┬────────────────────────────────┘
                      ▼
           Server actions + route handlers
                      │
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
      Prisma     Invite-token     Image
       (PG)        signer        volume
                  (HMAC)         (/var/images)
```

Deployment: one Next.js container + Postgres + a persistent volume for uploaded images. pg_dump sidecar writes nightly backups to an off-volume location.

## Data model (critical tables)

Paths below are illustrative for the scaffolded repo.

- `Invite` — `id`, `token_version`, `rsvp_mode` (`household|individual`), `plus_one_allowed`, `admin_notes`, timestamps
- `Guest` — `id`, `invite_id`, `display_name`, `is_plus_one`, `added_by_guest`, `order_index`
- `Event` — `id`, `slug`, `title`, `starts_at`, `ends_at`, `location_name`, `location_address`, `location_map_url`, `description_markdown`, `order_index`
- `InviteEventAllowance` — `(invite_id, event_id)` composite PK — which events this invite may attend
- `MenuCourse` — `id`, `event_id` (nullable for global menus), `title`, `order_index`
- `MenuOption` — `id`, `course_id`, `label`, `description`, `order_index`
- `RsvpResponse` — `id`, `guest_id`, `event_id`, `attending`, `allergies_text`, `song_request_text`, `submitted_at`, `updated_at`, UNIQUE(`guest_id`,`event_id`)
- `RsvpMenuSelection` — `response_id`, `course_id`, `option_id`
- `RsvpAuditLog` — `id`, `invite_id`, `guest_id` (nullable), `event_id` (nullable), `action`, `payload_json`, `actor` (`guest_token|admin_sub`), `occurred_at` — **append-only, never updated, never deleted**
- `ContentBlock` — `id`, `key` (unique: `hero`, `faq`, `travel`, `dress_code`, `gifts`), `title`, `body_markdown`, `updated_at`, `updated_by`
- `SiteSetting` — `key`, `value_json` (wedding_date, rsvp_deadline, site_title, hero_image_path)
- `ImageAsset` — `id`, `filename`, `disk_path`, `mime`, `bytes`, `width`, `height`, `uploaded_by`, `created_at`
- `AdminUser` — `id`, `oidc_sub`, `email`, `last_seen_at` (mirrored from Authelia on first login so audit-log rows can reference a stable local id; no allowlist check — Authelia is the authority for who may sign in)

### Invite token format

`base64url(invite_id) . base64url(token_version) . base64url(HMAC_SHA256(secret, invite_id || token_version))`

Rotation: bump `token_version`, old links 410 Gone. Secret lives in an env var; a single secret rotation invalidates all links (so prefer per-invite version bumps for normal rotation).

## Surfaces

### Public (unauthenticated)
- `/` — hero + names + date + countdown
- `/schedule` — list of `Event`s with venues and maps
- `/travel`, `/faq`, `/gifts` — rendered `ContentBlock`s
- `/rsvp/[token]` — guest RSVP flow (see below)

### Guest RSVP flow (`/rsvp/[token]`)
1. Validate token → load `Invite`, `Guest`s, allowed `Event`s, existing `RsvpResponse`s.
2. If past deadline → read-only summary view.
3. Otherwise: per-guest, per-event form. Attending toggle → reveals menu selectors + allergies + song request. Primary guest may add a +1 name if `plus_one_allowed`.
4. On submit: Zod-validated server action writes `RsvpResponse` + `RsvpMenuSelection` in a transaction and appends to `RsvpAuditLog`.
5. Post-submit: same URL shows "submitted, you can edit until {deadline}" + a summary.

### Admin (`/admin`, Authelia-gated)
- `/admin` dashboard — counts (attending / declined / not responded), recent RSVP activity (from audit log)
- `/admin/invites` — list, create, edit; rotate token; copy link; flags for `rsvp_mode` and `plus_one_allowed`
- `/admin/events` — CRUD events; set menu courses + options per event or globally
- `/admin/content` — edit `ContentBlock`s (markdown editor with preview)
- `/admin/images` — upload/manage assets on the volume
- `/admin/settings` — wedding date, RSVP deadline, site title, hero image
- `/admin/export` — CSV download of current RSVP state

## Auth model

- **Admin**: Auth.js with a custom OIDC provider pointed at Authelia. Authorisation is delegated entirely to Authelia — anyone who can authenticate through the home-lab IdP is a valid admin. No app-level allowlist. The Authelia client / access-control rules are the source of truth for who can reach `/admin`. Session cookie, HttpOnly, SameSite=Lax.
- **Guest**: no session. Token verified per request. Token identifies the `Invite`, never a single guest. Rate limit per token + per IP.
- **CSRF**: Next.js server actions include origin check; RSVP submits use double-submit cookie for extra safety since tokens sit in the URL.

## Security & reliability (addresses top concern: data loss)

1. **Append-only audit log** — every RSVP create/update/delete path writes a row to `RsvpAuditLog` in the same transaction. No UPDATE/DELETE on this table (enforced by DB grant).
2. **Soft delete only** on `Guest` and `RsvpResponse` (a `deleted_at` column); recovery is a boolean flip.
3. **Nightly `pg_dump`** to a separate volume with 14-day retention; weekly snapshot to off-host storage.
4. **Nightly CSV snapshot** of RSVPs written to a timestamped file on disk (belt-and-braces — survives even if DB restores are fumbled).
5. **Transactional writes** — every multi-row RSVP change runs inside a single Prisma transaction.
6. **Token rotation** — per-invite `token_version` bump invalidates a leaked link in seconds.
7. **Rate limiting** — token bucket per invite token and per IP on `/rsvp/[token]` POSTs.
8. **Observability** — structured logs, `/healthz` liveness, `/readyz` (DB ping), access log for every RSVP write.
9. **Hard-lock deadline** enforced server-side (not just UI) against `SiteSetting.rsvp_deadline`.

## Deployment

- One `Dockerfile` producing a minimal Next.js standalone image.
- `docker-compose.yml` for local dev (app + postgres + mailhog-not-needed-here).
- k8s manifests: Deployment, Service, Ingress (TLS via existing infra), PVC for image uploads and pg_dump output, Postgres StatefulSet (or external managed PG).
- Secrets: `DATABASE_URL`, `INVITE_TOKEN_SECRET`, `AUTH_SECRET`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`.
- CI: typecheck → unit → contract (Testcontainers PG) → e2e (Playwright) → build image.

## Test strategy (full TDD, matches user's global preferences)

- **Unit tests** — pure logic (token signing, deadline checks, menu validation, CSV serialiser). Written red-green-refactor. No mocks.
- **Fakes** at boundaries — `InviteTokenSigner`, `Clock`, `ImageStore`. The production and fake implementations share a **contract test** suite to keep them in lockstep.
- **Integration/contract tests** — run against real Postgres via Testcontainers. Prisma repositories are exercised end-to-end for RSVP write paths, audit-log invariants, deadline enforcement, token rotation.
- **End-to-end** — Playwright covers: guest happy path, guest edit-after-submit, past-deadline lock, admin OIDC login, admin CSV export.
- **No mocks for DB**. Follows the user's "contract tests with fakes / real integration test; use the fake as much as possible" rule.

Coding conventions to apply: result-style returns (`Result<T, E>` via neverthrow) for all business logic, full variable names (no abbreviations), self-documenting code over comments.

## Critical files to create (initial scaffold)

- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `Dockerfile`, `docker-compose.yml`
- `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`
- `src/app/(public)/layout.tsx`, `src/app/(public)/page.tsx`, `src/app/(public)/schedule/page.tsx`, `src/app/(public)/travel/page.tsx`, `src/app/(public)/faq/page.tsx`, `src/app/(public)/gifts/page.tsx`
- `src/app/rsvp/[token]/page.tsx`, `src/app/rsvp/[token]/actions.ts`
- `src/app/admin/layout.tsx` + per-section pages under `src/app/admin/*`
- `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/admin/export/route.ts`, `src/app/api/healthz/route.ts`
- `src/lib/invite-token.ts` (+ fake + contract test)
- `src/lib/clock.ts` (+ fake)
- `src/lib/image-store.ts` (+ fake + contract test)
- `src/lib/rsvp/submit.ts`, `src/lib/rsvp/audit.ts`, `src/lib/rsvp/deadline.ts`
- `src/lib/csv/rsvp-export.ts`
- `src/server/auth.ts` (Auth.js Authelia OIDC)
- `src/server/db.ts` (Prisma client)
- `scripts/nightly-snapshot.ts` (CSV + pg_dump wrapper)
- `tests/contract/*`, `tests/e2e/*`, `tests/unit/*`

## Delivery phases

1. **Scaffold & foundations** — Next.js app, Prisma schema, Docker, CI, Auth.js + Authelia, healthchecks.
2. **CMS core** — `ContentBlock`, `SiteSetting`, `Event`, admin pages for each, public pages rendering them.
3. **Guest model + invite tokens** — `Invite`, `Guest`, token signer + contract tests, admin invite CRUD, per-invite link copy.
4. **RSVP flow** — `RsvpResponse`, `RsvpMenuSelection`, menu admin, guest form, audit log, deadline lock, rate limit.
5. **Reporting & reliability** — CSV export, nightly snapshot script, pg_dump cron, `/healthz`+`/readyz`, backup restore runbook.
6. **Editorial polish** — custom serif/editorial public styling, imagery, countdown.
7. **Hardening** — Playwright e2e suite, load test RSVP endpoint, security review (token handling, CSRF, rate limits).

## Verification — how to test end-to-end

1. `docker compose up` → app + Postgres come up; visit `/` and confirm public site renders with seeded content.
2. Sign in to `/admin` via Authelia; create an `Event`, add menu courses, create an `Invite` with two guests, one event allowed, `plus_one_allowed=true`.
3. Copy the generated invite link, open incognito, submit RSVP: accept one guest, decline another, add a `+1`, pick menu + allergies + song.
4. Reload the link — form shows prior selections; edit and resubmit; confirm `RsvpAuditLog` has three entries (create + edits).
5. Rotate the invite's token in admin → old link returns 410, new link works.
6. Manually set `rsvp_deadline` to a past timestamp → guest sees read-only view; POST returns 403.
7. Admin `/admin/export` downloads CSV with all guests, selections, allergies, song requests.
8. Run nightly snapshot script; verify CSV and `pg_dump` files land in the expected paths.
9. `pnpm test` runs the unit + contract suites green; `pnpm e2e` runs Playwright green.

## Out of scope (explicitly)

Photo gallery, seating charts, guest-to-guest messaging, email notifications, SMS, multi-language, timezone switcher, kids menu, payment collection, live-streaming. Any of these can be added later but will not be built in the first delivery.
