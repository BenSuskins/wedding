# Wedding

> A self-hostable, bilingual wedding website with invite management and RSVP tracking.

## Overview

A Next.js application for couples who want to run their own wedding website end to end: shareable per-household invite links, per-guest RSVPs with menu and dietary choices, and a password- or OIDC-protected admin panel for editing everything from copy to theme. Built for self-hosting on a single Docker host.

## Features

- **Invite management** — per-household invites with signed tokens; rotate to invalidate links
- **RSVP** — per-guest responses, menu selections, dietary notes, and song requests
- **Events** — multiple events (ceremony, reception, etc.) each with their own menu and guest allowances
- **Bilingual content** — markdown content blocks in English and French, editable from the admin panel
- **Theme** — colours and fonts customisable with live preview; no rebuild required
- **Image uploads** — upload images directly from the admin panel
- **Export** — download a CSV of guest responses, menu choices, and dietary requirements
- **Admin auth** — OIDC SSO (Auth.js) or simple `ADMIN_PASSWORD` login; all `/admin` routes protected

## Tech Stack

- Node.js 20+, TypeScript
- [Next.js 15](https://nextjs.org) (App Router)
- [Prisma 7](https://www.prisma.io) + PostgreSQL
- [Auth.js 5](https://authjs.dev) (OIDC or password login)
- [Tailwind CSS 4](https://tailwindcss.com)
- [neverthrow](https://github.com/supermacro/neverthrow) for result-style errors
- [Zod](https://zod.dev) for input validation
- Docker for local Postgres and production builds

## Project Structure

```
wedding/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin panel (auth-protected)
│   │   ├── api/            # API routes (RSVP, export)
│   │   └── [locale]/       # Guest-facing pages
│   ├── components/
│   ├── lib/
│   │   ├── invite/         # Invite & guest domain logic
│   │   ├── rsvp/           # RSVP, menu, export logic
│   │   ├── content/        # Events, content blocks, site settings
│   │   └── admin/          # Admin session helper
│   └── server/
│       ├── auth.ts         # Auth.js + OIDC setup
│       └── db.ts           # Prisma client singleton
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/
├── tests/
│   ├── unit/               # Pure logic, no DB
│   ├── contract/           # Real Postgres via Testcontainers
│   └── e2e/                # Playwright
└── docs/
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10
- Docker (for the local Postgres database)

### Setup

```bash
git clone git@github.com:bensuskins/wedding.git
cd wedding
pnpm install
docker compose up -d db
cp .env.example .env.local        # fill in values
pnpm db:migrate
pnpm dev
```

Verify: visit `http://localhost:3000` — you should see the guest-facing home page.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `INVITE_TOKEN_SECRET` | yes | — | HMAC secret for signing invite links; rotate to invalidate all links |
| `AUTH_SECRET` | yes | — | Auth.js session secret |
| `ADMIN_PASSWORD` | no | — | Simple password login (easiest for self-hosting) |
| `OIDC_ISSUER` | no | — | OIDC issuer URL (Authelia, Keycloak, Google, etc.) |
| `OIDC_CLIENT_ID` | no | — | OIDC client ID |
| `OIDC_CLIENT_SECRET` | no | — | OIDC client secret |

At least one of `ADMIN_PASSWORD` or all three `OIDC_*` vars must be set to enable admin login.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Run the dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type check |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests (vitest) |
| `pnpm test:contract` | Contract tests against real Postgres (Testcontainers) |
| `pnpm e2e` | Playwright end-to-end tests |
| `pnpm db:migrate` | Create and apply migrations (dev) |
| `pnpm db:migrate:deploy` | Apply pending migrations (production) |

## Customisation

Everything below is configurable from the admin panel — no code changes required:

| Admin page | What you can change |
|---|---|
| **Settings** | Couple names, wedding date, RSVP deadline, hero/venue/travel images, nav logo, meta tags |
| **Content** | Markdown for hero introduction, travel info, and FAQ — English and French |
| **Events** | Add, edit, or remove events; set venue, times, and optional description |
| **Events → Menu** | Create courses and options per event |
| **Invites** | Create per-household invite links; manage guests; rotate tokens |
| **Theme** | Colours and font stacks via CSS variable overrides with live preview |

To change fonts at the code level, edit the Google Fonts import and `--font-serif` / `--font-sans` values in `src/app/globals.css`.

## Deployment

Build and run the full stack with Docker:

```bash
docker compose --profile full up --build
```

Or build the image directly:

```bash
docker build -t wedding .
```

Set all environment variables listed above and run `pnpm db:migrate:deploy` before starting the app in production.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

[MIT](../LICENSE)
