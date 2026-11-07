# Listiq

Listiq is a personal media tracker for movies, TV series, anime, manga, games, books, and comics. Keep a library of what you watch, read, and play, and share recommendations through lists and reviews. [Open Listiq](https://listiq-topaz.vercel.app)

![Listiq dashboard with recommendations and library activity](docs/screenshots/dashboard-desktop.jpg)

[Features](#features) · [Routes](#routes) · [Local setup](#run-locally) · [Tests](#checks) · [Deployment](#deployment) · [Catalog sync](#catalog-sync)

## Features

- **Library and catalog.** Search titles by name, filter by media type, and sort by release date, popularity, ratings, or review activity. Add titles to your library, update your status, and leave a rating or review.
- **Discover.** Browse a deck of recommendations. Skip a title, add it to your library, or save it for later.
- **Lists.** Create and reorder lists, choose their visibility, and browse or save lists shared by other members.
- **Profiles.** View a member's library, reviews, activity, and posts according to their privacy settings. Manage your own profile images, account security, and visibility in Settings.
- **Submissions.** Members can propose a missing title, follow its status, and resubmit after requested edits. Moderators and admins can approve, reject, or request changes. Verified members, moderators, and admins can also add titles directly.

## Routes

| Route | Access | What it does |
| --- | --- | --- |
| `/` | Public | Landing page. Signed-in users are sent to the dashboard. |
| `/login`, `/register` | Guests | Sign in or create an account. |
| `/credits` | Public | Catalog data sources and attribution. |
| `/dashboard` | Signed in | Library overview and title picks. |
| `/titles` | Signed in | Search and browse the catalog. Accepts `q`, `type`, and `sort`. |
| `/titles/[slug]` | Signed in | Title details, source links, and library or review actions. |
| `/discover` | Signed in | Recommendation deck with save and skip actions. |
| `/lists` | Signed in | Browse public lists. Accepts `q`, `sort`, and `page`. |
| `/lists/[username]/[slug]` | Signed in, subject to list visibility | View a list. The owner can edit and reorder it. |
| `/my-lists` | Signed in | Manage your own lists and access saved lists. |
| `/users/[username]` | Signed in, subject to profile privacy | View a member's profile and visible activity. |
| `/settings/profile` | Signed in | Profile images, privacy, and account security. |
| `/add-title` | Signed in | Submit a title or add it directly with an eligible role. |
| `/my-submissions` | Signed in | Review feedback and revise your submissions. |
| `/submissions` | Moderator or admin | Review the submission queue. |

For example, `/titles?q=interstellar&type=MOVIE&sort=highest-rated` searches movies by name and sorts the results by rating.

## Project layout

Listiq uses the Next.js App Router with React and TypeScript. Prisma manages the PostgreSQL schema and migrations. Cloudinary handles image uploads, and Vercel Workflow runs catalog imports.

| Directory | Responsibility |
| --- | --- |
| `app/` | Pages, layouts, and HTTP route handlers. |
| `actions/` | Server Actions for features such as authentication, lists, and submissions. |
| `lib/` | Database access, session and privacy rules, catalog scoring, and provider integrations. |
| `prisma/` | Schema and SQL migrations. |
| `workflows/` | Catalog import, scoring, and runtime checks. |
| `scripts/`, `tests/` | Maintenance commands, unit tests, and database integration tests. |

## Run locally

Install **Node.js 24** and **PostgreSQL**. Create an empty development database with `pg_trgm` available and a migration role that can install the extension.

```sh
npm ci
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env` for the second command. Configure the following variables in `.env`. [Environment template](.env.example)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection for the app. Use a pooled URL on Neon. |
| `DATABASE_URL_UNPOOLED` | Direct connection to the same database for migrations. A local connection string can serve both purposes. |
| `SESSION_SECRET` | Random secret used to sign user sessions. |

Generate a session secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

```sh
npm run db:generate
npm run db:migrate
npm run dev
```

Open [localhost:3000](http://localhost:3000) and create an account. To populate the empty development catalog with a curated TMDB import, set `TMDB_ACCESS_TOKEN` and run:

```sh
npm run catalog:seed -- tmdb
```

Use `npm run catalog:status` to inspect the result. [Provider settings and attribution](docs/provider-review.md)

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run test:integration` requires local PostgreSQL and a role with `CREATEDB`. The runner creates and removes its own test database. [Integration tests](docs/integration-tests.md) · [CI](docs/ci.md)

## Deployment

Use separate PostgreSQL databases and secrets for Preview and Production. Vercel runs `npm run vercel-build` to generate Prisma Client, apply pending migrations, and build the app. Configure Cloudinary credentials for image uploads. [Deployment and recovery](docs/operations.md) · [Upload security](docs/upload-security.md)

## Catalog sync

| Production schedule (UTC) | Endpoint |
| --- | --- |
| 03:00 daily | `GET /api/cron/sync-titles` starts the workflow. |
| 07:00 daily | `GET /api/cron/check-sync` checks recent runs and reports problems. |

Set `CRON_SECRET`, `TMDB_ACCESS_TOKEN`, and `RAWG_API_KEY` for scheduled imports. Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to receive alerts.

To start a run manually, call `GET /api/cron/sync-titles` with `Authorization: Bearer <CRON_SECRET>`. A `202` means the workflow was accepted. The endpoint skips a duplicate request when a run is active or a run has already succeeded that UTC day.

For diagnostics, authenticated `POST /api/cron/check-sync` starts a runtime probe. Read its result with `GET /api/cron/check-sync?probe=<workflowRunId>`.

When an import section exhausts its retries, the workflow proceeds to the remaining sections and keeps titles already saved. A partial run is recorded as `FAILED` so monitoring can report the incomplete import. [Sync operations](docs/operations.md#daily-sync-and-incident-handling)
