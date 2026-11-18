# Listiq

Listiq is a media tracker for movies, TV series, anime, manga, games, books, and comics. Keep one library of everything you watch, read, and play — rate it, review it, organise it into lists, and see your taste visualised. [Open Listiq](https://listiq-topaz.vercel.app) · **Try the live demo — no signup**

![Listiq landing page with a wall of real catalog posters](docs/screenshots/landing-hero.jpeg)

[Features](#features) · [Screenshots](#screenshots) · [Tech](#tech-highlights) · [Routes](#routes) · [Local setup](#run-locally) · [Docker](#run-with-docker) · [Billing](#billing-stripe-test-mode) · [Tests](#checks) · [Deployment](#deployment)

## Features

- **One-click demo.** A private, pre-filled sandbox account with five months of history. Sandboxes expire after 24 hours, and anything that could reach other members or storage is disabled.
- **Insights.** Rating distribution, library by media type, a 26-week activity heatmap, monthly additions, favourite genres, decades, and a hall of fame.
- **Year in review.** A Wrapped-style animated story of your year — busiest month, favourite media type and genre, rating persona, and your top-rated titles.
- **Command palette.** Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> anywhere to search titles, public lists, and members or to jump to any page.
- **Pro plan on Stripe (test mode).** Checkout, Customer Portal, a signed webhook, and Pro-only features: CSV import from Letterboxd, Goodreads, or any tracker, plus advanced insights.
- **Library and catalog.** Search titles by name, filter by media type, and sort by release date, popularity, ratings, or review activity. Add titles to your library, update your status, and leave a rating or review.
- **Discover.** Browse a deck of recommendations. Skip a title, add it to your library, or save it for later.
- **Lists.** Create and reorder lists, choose their visibility, and browse or save lists shared by other members.
- **Profiles.** View a member's library, reviews, activity, and posts according to their privacy settings. Manage your own profile images, account security, and visibility in Settings.
- **Submissions.** Members can propose a missing title, follow its status, and resubmit after requested edits. Moderators and admins can approve, reject, or request changes. Verified members, moderators, and admins can also add titles directly.

## Screenshots

| Dashboard | Insights |
| --- | --- |
| ![Personal dashboard with library stats and onboarding](docs/screenshots/dashboard-desktop.jpeg) | ![Insights with rating curve, media mix and activity heatmap](docs/screenshots/insights-desktop.jpeg) |
| **Title page** | **Command palette** |
| ![Title page with cinematic backdrop](docs/screenshots/title-details-desktop.jpeg) | ![Ctrl+K command palette searching the catalog](docs/screenshots/command-palette.jpeg) |

| **Year in review** | **Landing features** |
| ![Wrapped-style year in review story](docs/screenshots/year-in-review.jpeg) | ![Animated feature bento on the landing page](docs/screenshots/landing-features.jpeg) |

## Tech highlights

- **Next.js App Router** with React Server Components, Server Actions, route handlers, metadata routes (dynamic OG image, icons, sitemap, robots), and per-page metadata.
- **PostgreSQL + Prisma** with reviewed SQL migrations, trigram search indexes, and row locks for concurrent library edits.
- **Catalog pipeline** on Vercel Workflow: daily imports from TMDB, RAWG, MangaUpdates, Wikidata, and more, with scoring, provider safeguards, Telegram alerts, and health checks.
- **Security**: signed sessions, rate limiting, upload signature checks, privacy-aware queries, guarded demo sandboxes, and Stripe webhook signature verification. Live Stripe keys are refused.
- **Motion design** with `motion`: scroll-driven showcase, layout animations, count-ups, and reduced-motion support throughout.
- **Quality gates**: unit tests for security, billing, import parsing and sandbox guards; database integration tests; CI with migration replay, type checking, lint, and builds.

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
| `/stats` | Signed in | Personal insights and charts. Advanced cards are Pro. |
| `/stats/wrapped` | Pro | Animated year-in-review story. |
| `/settings/profile` | Signed in | Profile images, privacy, and account security. |
| `/settings/import` | Pro | Import ratings from Letterboxd, Goodreads, or any CSV. |
| `/settings/billing` | Signed in | Plan, Stripe Checkout, and the Customer Portal. |
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

### Run with Docker

With Docker installed, one command starts PostgreSQL and the production build on [localhost:3000](http://localhost:3000). Migrations run automatically on start.

```sh
docker compose up --build
```

Fill the empty database with the synthetic demo catalog, users and lists:

```sh
docker compose --profile tools run --rm seed
```

To develop with hot reload against the containerized database, run `docker compose up db` and point `DATABASE_URL` and `DATABASE_URL_UNPOOLED` at `postgresql://listiq:listiq@127.0.0.1:5433/listiq`.

## Billing (Stripe test mode)

Listiq has a Free and a Pro plan. Pro is sold through Stripe Checkout, managed in the Stripe Customer Portal, and kept in sync by a signed webhook at `/api/stripe/webhook` (`customer.subscription.*` and `checkout.session.completed`). Billing only runs with **test-mode** keys; a live key is ignored so a deployment can never charge real cards.

1. Set `STRIPE_SECRET_KEY` (an `sk_test_…` key). `STRIPE_PRO_PRICE_ID` is optional; without it Checkout uses an inline $4/month price.
2. Add a webhook endpoint for `https://<your-domain>/api/stripe/webhook` with the events above and set `STRIPE_WEBHOOK_SECRET`. Locally, run `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
3. Open **Settings → Plan & billing** and pay with card `4242 4242 4242 4242`, any future expiry and any CVC.

The plan also updates immediately when Checkout redirects back, so the flow works before the webhook arrives.

## Demo sandbox

The landing page's **Try the live demo** button creates a temporary guest account with a pre-filled library and lists, picked from the catalog. Sandboxes are private and expire after 24 hours, and signing out deletes them. Uploads, posts, comments, account changes, title submissions, and public sharing are disabled for guests.

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
