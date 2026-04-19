# Security review

Scope: the wedding app's RSVP + CMS surfaces. Dated 2026-04-19; re-review before every deploy touching auth, tokens, or rate limits.

## Threat model (what we actually worry about)

1. **RSVP data loss or corruption** — ranked #1 by the owner. Covered by the append-only `RsvpAuditLog`, nightly `pg_dump` + CSV snapshots, and transactional writes. See `docs/runbooks/backup-restore.md`.
2. **Invite-link leakage** — a signed invite link is a bearer token. Mitigated by per-invite `tokenVersion` rotation (old versions 410) and rate limiting per token + per IP.
3. **Unauthorised admin access** — delegated to self-hosted Authelia; the app has no local allowlist. Any Authelia-approved subject becomes an admin.
4. **Tampering with someone else's RSVP** — a valid token is scoped to an Invite; guests on other invites cannot be addressed. Server action validates `guestId` is owned by the invite and `eventId` is in the invite's event allowance.
5. **Deadline evasion** — enforced server-side in `src/lib/rsvp/deadline.ts`; the UI lock is cosmetic.

## Token handling

- Format: `base64url(inviteId).base64url(tokenVersion).base64url(HMAC_SHA256)`.
- Secret: `INVITE_TOKEN_SECRET`, loaded via `src/server/env.ts`, never logged.
- Verification: constant-time compare inside `src/lib/invite-token.ts`. Contract test exists.
- Rotation: admin bumps `tokenVersion`; old links produce a verification failure (410). A single secret rotation invalidates every link at once — emergency-only.
- Storage: links are not stored in analytics or error logs. Ensure any future observability code redacts the `[token]` path segment.

**Residual risk**: a leaked link stays valid until the admin rotates. There is no session for guests (intentional — editable without passwords). Acceptable given the audience.

## CSRF

- Admin server actions: Next.js origin-check default + session cookie (HttpOnly, SameSite=Lax).
- Guest RSVP server actions: same origin check; the token-in-URL is not a secret in the CSRF sense, so the action requires a matching Next.js action token (generated per render). Form posts from other origins are rejected by Next.js.
- CSV export endpoint: GET only; no mutation. Auth-gated.

## Rate limiting

- In-memory token bucket in `src/lib/rsvp/rate-limit.ts`. Two limiters: per-token (15/min) and per-IP (60/min). Single-container deploy, so memory-backed is acceptable. If scaled horizontally, move to Redis.
- IP resolution uses the first entry of `x-forwarded-for`, falling back to `x-real-ip`. The ingress MUST strip attacker-controlled `x-forwarded-for` and set the real client IP. Document this for the operator.

## HTTP security headers

Configured via `next.config.ts` `headers()`:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` — `default-src 'self'`; inline styles allowed (Tailwind preflight); no inline scripts; `frame-ancestors 'none'`.
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Powered-By` removed via `poweredByHeader: false`.

If a future feature needs external fonts or analytics, extend the CSP explicitly — no broad wildcards.

## Input validation

- All server actions validate input with Zod schemas (`parseWithSchema`) before touching Prisma.
- Menu selections validated against the event's actual course/option set to prevent cross-event or fabricated option IDs.
- Markdown content is rendered via `sanitize-html` in `RenderedMarkdown` — review that sanitiser's allowlist when adding new content blocks.

## Append-only audit log

- `rsvp_audit_log` has plpgsql BEFORE UPDATE/DELETE/TRUNCATE triggers that raise. Covered by a contract test.
- If you need to redact a row, document it: never UPDATE; write a compensating `admin_redact` entry.

## Secrets

`DATABASE_URL`, `INVITE_TOKEN_SECRET`, `AUTH_SECRET`, `OIDC_CLIENT_SECRET` are all environment-only. The repo has no checked-in secrets. `poweredByHeader` is off. Logging avoids echoing request bodies.

## Known gaps / accepted risk

- No WAF / bot filter at the app layer. Rely on the home-lab ingress.
- No 2FA at the app layer — delegated to Authelia.
- No per-user audit trail of admin *reads* (only writes go to `RsvpAuditLog`). Accepted: single-admin deploy.
- CSV export does not redact anything; it is the authoritative export. Treat the file as sensitive.

## Re-review triggers

- Adding a new role or removing the Authelia dependency
- Exposing any endpoint over a new origin (CORS)
- Adding third-party scripts (analytics, embeds)
- Switching from in-memory rate limiting to distributed
- Any change to invite token format
