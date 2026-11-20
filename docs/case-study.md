# Case study: building Listiq

Listiq is a media tracker for movies, series, anime, manga, books and games: one
library, ratings, reviews, lists, a social profile, discovery, yearly insights and
a Pro plan on Stripe. This document explains the harder decisions behind it — what
I chose, why, and what it cost.

**Stack:** Next.js 16 (App Router, Server Components, Server Actions), React 19,
TypeScript, Tailwind v4, Prisma 7 on PostgreSQL (Neon), Vercel Workflow, Stripe,
Cloudinary, Zod, Playwright.

**Size:** 21 Prisma models, 35 committed migrations, 7 catalog providers, 74 unit
tests, 29 database integration tests and 5 browser end-to-end tests, all running
in CI on every push.

---

## 1. Architecture: server-first, with one direction of dependencies

```
app/ (routes, RSC, client islands) ─┐
actions/ (Server Actions)          ─┼─▶ lib/ (domain logic) ─▶ PostgreSQL / providers
scripts/ (operator CLIs)           ─┘
```

Pages are Server Components that query the database directly; interactivity lives
in small client components. Every mutation is a Server Action that does the same
four things in order: authenticate, validate with Zod, check ownership or role
against the database, then call a function in `lib/`.

**Why:** there is no separate REST layer to keep in sync with the UI, and
authorization sits next to every write instead of in a client-side guard. Hidden
buttons are never treated as security.

**Trade-off:** Server Actions are awkward to call from outside the app. The few
endpoints that must be public — Stripe webhook, cron sync, health check, data
export — are explicit route handlers.

## 2. Privacy is enforced in queries, not in components

Every profile section (library, reviews, stats, posts, activity) has its own
visibility flag. Queries for another user's data apply those flags in the `where`
clause, and public pages (`/title/[slug]`, `/list/[user]/[slug]`) use dedicated
loaders that never select private fields.

**Why:** if privacy is checked in JSX, one forgotten condition leaks data. Doing
it in the data layer means a component cannot render what it never received.
Integration tests assert that private profiles, lists, reviews and posts stay out
of strangers' and signed-out visitors' results.

## 3. Rate limiting without Redis

Auth, uploads, posts, comments and demo sign-ins are rate limited with a single
atomic PostgreSQL statement (`INSERT … ON CONFLICT DO UPDATE … WHERE count < limit
RETURNING count`) in `lib/security/rateLimit.ts`. Identities such as IP and email
are SHA-256 hashed before they are stored.

**Why:** on serverless, in-memory counters reset on every cold start and are not
shared between instances. Redis would be another paid service and another
failure mode. One row per window in Postgres is atomic, survives deploys and
fails closed if the database is down.

**Trade-off:** each limited request costs one extra query — far cheaper at this
traffic level than a new dependency.

## 4. One-click demo without a shared demo account

"Try the live demo" creates a real, temporary guest user with about 22 titles of
believable history spread over five months, then signs them in. Guests are
flagged (`isGuest`, `guestExpiresAt`) and blocked from outward-facing actions —
posting, commenting, uploading, billing — by a guard at the action level. Each new
demo start also deletes a batch of expired sandboxes, so cleanup needs no
separate job.

**Why:** a shared demo account gets vandalised and shows other visitors' edits.
Per-visitor sandboxes let a reviewer click everything, including destructive
actions, without affecting anyone else.

## 5. Stripe: the webhook is the source of truth

Checkout creates a subscription in Stripe test mode. Plan changes are applied
from signed webhook events (`checkout.session.completed`,
`customer.subscription.*`), verified against the raw request body. When the user
returns from Checkout, the billing page also confirms that session server-side,
so the UI is correct even if the webhook lands a second later.

**Why:** redirects can be faked or interrupted; webhooks are signed and retried by
Stripe. Confirming on return removes the "I paid but I'm still Free" race without
trusting the browser.

**Safety:** the Stripe client refuses any key that is not `sk_test_`, so the
project cannot take real money by accident. Plan limits — for example 30 Discover
picks a day on Free — are enforced in server actions, not in the UI.

## 6. Catalog: many providers, one normalized model

Titles come from TMDB, RAWG, AniList, MangaUpdates, Google Books, Comic Vine and an
open-catalog source. Each provider module normalizes its response into the same
shape; `lib/catalog` persists titles, aliases and external IDs, and a pure scoring
function ranks them. The daily sync runs as a Vercel Workflow with per-provider
page cursors, so one failing provider doesn't block the others and a retry
resumes where it stopped.

**Why:** external APIs fail, rate-limit and change. Keeping provider code at the
edge and scoring pure (no Prisma, no framework) makes both easy to test.

## 7. Library import that tolerates messy data

Letterboxd, Goodreads and generic CSV exports are parsed, 5-star ratings are
converted to the 10-point scale, and titles are matched against the catalog with
an alias index, SQL-side name normalisation and a candidate scoring function
(name similarity, year, media type). Unmatched rows are reported back instead of
guessed.

**Why:** a wrong match silently corrupts someone's library; an honest "not found"
list doesn't.

## 8. Testing strategy

| Layer | Tool | What it proves |
| --- | --- | --- |
| Unit (74) | `node:test` | Pure logic: CSV parsing, scoring, rate-limit policy, upload validation, webhook signature handling |
| Integration (29) | `node:test` + real Postgres | Each run creates and migrates an isolated database; covers privacy, concurrency, guest guards, export and account deletion |
| End-to-end (5) | Playwright | Landing → sign-up, demo sandbox, register / sign out / sign in, add and rate a title, public pages and real 404s |

CI replays every migration on an empty Postgres, then runs typecheck, lint, all
three test layers and the production build. The e2e suite runs against that
exact build with `next start`.

The integration suite paid for itself early: it caught duplicate activity events
from two identical concurrent review writes, and an upsert race on the first
Discover save. Both were fixed with row locks and native conflict-safe inserts.

## 9. What I would do next

- Move the remaining query logic out of older Server Actions into `lib/`, so every
  action is a thin authenticate → validate → call wrapper.
- Direct-to-Cloudinary uploads for large videos; the current path is capped by the
  serverless request body limit.
- Real-time notifications instead of loading them when the bell opens.
- Recommendations from co-rated titles instead of genre overlap.
