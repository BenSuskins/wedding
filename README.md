# Wedding App

A Next.js wedding website with guest invite management, RSVP tracking, and a password-protected admin panel.

## Features

- **Invite management** — create per-household invites with signed tokens; rotate tokens to invalidate links
- **RSVP** — per-guest responses, menu selections, dietary notes, and song requests; household or individual RSVP modes
- **Events** — multiple events (ceremony, reception, etc.) each with their own menu and guest allowances
- **Content** — markdown-based content blocks (hero, FAQ, travel info) editable from the admin panel; English and French supported
- **Settings** — site title, wedding date, RSVP deadline, venue images
- **Export** — download a CSV of all guest responses, menu choices, and dietary requirements
- **Admin auth** — SSO via any OIDC provider (Auth.js), or simple `ADMIN_PASSWORD` login; all routes under `/admin` are protected
- **Theme** — colours and fonts customisable from the admin panel with live preview; no rebuild required
- **Image uploads** — upload images directly from the admin panel; images are served from the app's own storage

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router)
- [Prisma 7](https://www.prisma.io) + PostgreSQL
- [Auth.js 5](https://authjs.dev) (OIDC or password login)
- [Tailwind CSS 4](https://tailwindcss.com)
- [neverthrow](https://github.com/supermacro/neverthrow) for result-style error handling
- [Zod](https://zod.dev) for input validation

## Local development

### Prerequisites

- Node.js >= 20
- pnpm 10
- Docker (for the local database)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start the local Postgres database
docker compose up -d db

# 3. Copy env file and fill in values
cp .env.example .env.local

# 4. Run database migrations
pnpm db:migrate

# 5. Start the dev server
pnpm dev
```

The app will be at [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `INVITE_TOKEN_SECRET` | ✅ | HMAC secret for signing invite links — rotate to invalidate all links |
| `AUTH_SECRET` | ✅ | Auth.js session secret |
| `ADMIN_PASSWORD` | ☐ | Simple admin password login — easiest for self-hosting |
| `OIDC_ISSUER` | ☐ | OIDC issuer URL (Authelia, Keycloak, Google, GitHub, etc.) |
| `OIDC_CLIENT_ID` | ☐ | OIDC client ID |
| `OIDC_CLIENT_SECRET` | ☐ | OIDC client secret |

At least one of `ADMIN_PASSWORD` or all three OIDC vars must be set to enable admin login.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type check |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests |
| `pnpm test:contract` | Contract/integration tests (requires Docker) |
| `pnpm e2e` | Playwright end-to-end tests |
| `pnpm db:migrate` | Run pending migrations (dev) |
| `pnpm db:migrate:deploy` | Run pending migrations (production) |

## Customisation

Everything is configurable from the admin panel — no code changes needed:

| Admin page | What you can change |
|---|---|
| **Settings** | Couple names, wedding date, RSVP deadline, hero/venue/travel images, nav logo, meta tags |
| **Content** | Markdown for the hero introduction, travel info, and FAQ — English and French |
| **Events** | Add, edit, or remove events; set venue, times, and optional description |
| **Events → Menu** | Create courses and options per event (for dietary/menu RSVP) |
| **Invites** | Create per-household invite links; manage guests; rotate tokens |
| **Theme** | Colours and font stacks via CSS variable overrides with live preview |

To change fonts, update the Google Fonts import URL and `--font-serif` / `--font-sans` values in `src/app/globals.css`, or set them directly in Admin → Theme.

## Project structure

```
src/
  app/
    admin/          # Admin panel (auth-protected)
    api/            # API routes (RSVP, export)
    [locale]/       # Guest-facing pages
  lib/
    invite/         # Invite & guest domain logic
    rsvp/           # RSVP, menu, export logic
    content/        # Events, content blocks, site settings
    admin/          # Admin session helper
  server/
    auth.ts         # Auth.js + Authelia OIDC setup
    db.ts           # Prisma client singleton
prisma/
  schema.prisma     # Database schema
  migrations/       # Migration history
tests/
  contract/         # Integration tests against real Postgres (testcontainers)
```

## Deployment

Build and run with Docker:

```bash
docker compose --profile full up --build
```

Or build the image directly:

```bash
docker build -t wedding .
```

Set all environment variables listed above and run `pnpm db:migrate:deploy` before starting the app in production.
