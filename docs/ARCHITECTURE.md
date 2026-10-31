# Architecture

> System design, components, and data flow for Wedding.

## Overview

Wedding is a self-hosted bilingual site built as one Next.js application. Guest pages
and the admin panel use the same app, which runs domain logic on the server and persists
structured data in PostgreSQL through Prisma. Guest access uses signed household invite
links; administrators use Auth.js with OIDC or password sign-in.

## Diagram

```mermaid
flowchart LR
    Guest["Guest browser"] --> App["Next.js App Router"]
    Admin["Admin browser"] --> App
    App --> Domain["Domain modules<br/>invite, RSVP, content"]
    App --> Auth["Auth.js"]
    Auth -.->|"optional OIDC"| OIDC["Authelia or OIDC provider"]
    Domain --> Prisma["Prisma adapter"]
    Prisma --> DB[("PostgreSQL")]
    App --> Uploads["Persistent image directory"]
    Domain --> Tokens["HMAC invite-token signer"]
```

## Components

| Component | Responsibility | Location |
|-----------|---------------|----------|
| Guest pages | Localised public pages, event details, and token-based RSVP forms | `src/app/(public)/`, `src/app/rsvp/[token]/` |
| Admin panel | Authenticated editing for invites, guests, events, menus, content, and settings | `src/app/admin/` |
| Route handlers and server actions | Handle RSVP submissions, image uploads, exports, health checks, and admin mutations | `src/app/api/`, `src/app/rsvp/[token]/actions.ts`, `src/app/admin/` |
| Domain modules | Validate invite, RSVP, menu, content, and export operations; return result-style errors | `src/lib/invite/`, `src/lib/rsvp/`, `src/lib/content/`, `src/lib/csv/` |
| Authentication | Auth.js configuration, admin identity, Edge-safe middleware, and Node-only Prisma-backed setup | `src/server/auth.config.ts`, `src/server/auth.ts`, `src/middleware.ts` |
| Database | PostgreSQL schema, migrations, and Prisma client | `prisma/`, `src/server/db.ts` |
| Image storage | Uploaded image files plus database metadata | `UPLOAD_DIR` (defaults to `public/uploads`), `ImageAsset` model |

## Request Flow

A guest opens a signed RSVP link and submits a response. The page and server action run
in the Node.js runtime because they access Prisma.

```mermaid
sequenceDiagram
    actor Guest
    participant Browser
    participant Page as Next.js RSVP page
    participant Signer as HMAC token signer
    participant Loader as RSVP loader
    participant Action as server action
    participant Domain as RSVP domain module
    participant DB as PostgreSQL via Prisma

    Guest->>Browser: Open /rsvp/token
    Browser->>Page: Request RSVP page
    Page->>Loader: Load invite, guests, events, and responses
    Loader->>Signer: Verify signature and token version
    Signer-->>Loader: Invite ID and token version
    Loader->>DB: Read allowed RSVP state
    DB-->>Loader: Invite and event data
    Loader-->>Page: Validated RSVP state
    Page-->>Browser: Render guest form
    Guest->>Browser: Submit attendance and menu choices
    Browser->>Action: Submit RSVP form
    Action->>Signer: Verify token and current version
    Signer-->>Action: Invite ID and token version
    Action->>DB: Resolve invite and read RSVP deadline
    Action->>Domain: Validate and save response
    Domain->>DB: Check deadline, write response and audit entry in a transaction
    DB-->>Domain: Saved response
    Domain-->>Action: Submission result
    Action-->>Browser: Confirmation and refreshed RSVP page
```

## Key Decisions

- **Keep the application in one release unit.** Next.js serves the site and runs its
  server actions and route handlers. Domain rules live in `src/lib/`; Prisma access
  stays on the server.
- **Separate Edge-safe authentication from Node-only database work.**
  `src/middleware.ts` imports the lean auth config. Prisma-backed authentication and
  routes run in Node.js.
- **Make guest links revocable.** Each signed token includes an invite ID and token
  version. Rotating the version invalidates older links without deleting guest data.
- **Record RSVP changes.** Response writes and their append-only audit entries are
  committed together in a PostgreSQL transaction.
- **Persist uploaded files separately from their metadata.** PostgreSQL stores image
  metadata. The image bytes live in `UPLOAD_DIR`, which must persist with the self-
  hosted deployment.

## Data Model

```mermaid
erDiagram
    INVITE ||--o{ GUEST : includes
    INVITE ||--o{ INVITE_EVENT_ALLOWANCE : grants
    EVENT ||--o{ INVITE_EVENT_ALLOWANCE : allows
    GUEST ||--o{ RSVP_RESPONSE : submits
    EVENT ||--o{ RSVP_RESPONSE : receives
    RSVP_RESPONSE ||--o{ RSVP_MENU_SELECTION : contains
    MENU_COURSE ||--o{ MENU_OPTION : offers
    MENU_OPTION ||--o{ RSVP_MENU_SELECTION : selected
    INVITE ||--o{ RSVP_AUDIT_LOG : records
```

A response is unique for each guest and event. An invite's event allowances control
which events its guests can attend. Menu courses can be shared across events or tied to
one event. The full schema is in `prisma/schema.prisma`.

## External Dependencies

| Service | Purpose | Failure mode |
|---------|---------|--------------|
| PostgreSQL | Stores invites, guests, events, RSVPs, content, settings, and audit records | Guest and admin operations that need data cannot complete until the database is available. |
| OIDC provider | Optional administrator sign-in through Auth.js | Use the configured password login when enabled; otherwise admin sign-in is unavailable until OIDC recovers. |
| Persistent filesystem | Stores uploaded image bytes referenced by `ImageAsset` rows | Images are unavailable if the upload directory is missing; restore it with the database backup. |
