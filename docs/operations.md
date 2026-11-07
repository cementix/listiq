# Architecture and operations

Use the [release checklist](../TODO.md) to track deployment verification.

## Module boundaries

| Layer | Responsibility |
| --- | --- |
| `app/` | Next.js routes, server-rendered queries, client components and route handlers. Route groups separate authentication, protected screens and moderation. |
| `actions/` | Server-action entry points: authenticate, validate input, check roles/ownership, call domain operations and invalidate affected views. Some existing actions still contain persistence/query logic; keep new reusable logic in `lib/`. |
| `lib/auth`, `lib/session`, `lib/privacy` | Database-backed authorization, signed cookie sessions and visibility rules. Hidden navigation is not an authorization boundary. |
| `lib/library`, `lib/title-list` | Shared mutations used by normal UI and Discover. Callers supply transactions where required so writes and activity events commit together. |
| `lib/catalog` | Import orchestration, pure score calculation and database persistence. `seedCatalog` imports, scores successful results, then reports provider failures. |
| `lib/sync/providers` | External API requests and provider normalization. `lib/sync/syncRun.ts` records daily execution status. |
| `lib/uploads`, `lib/security` | Cloudinary upload policy, resource ownership and database-backed rate limits. See [upload security](upload-security.md). |
| `lib/cache` | Shared invalidation for catalog, library and list changes. |
| `lib/prisma.ts` | Shared Prisma client using `pg`, a pool of at most five connections and Vercel pool lifecycle integration. |
| `scripts/`, `prisma/migrations/` | Operator entry points and committed database history. |

Dependency direction is `app/actions/scripts -> lib -> database/providers`.
Do not introduce `lib -> actions` imports. Keep pure scoring independent of
Prisma and framework APIs. Authenticate and check ownership at each externally
callable mutation; never trust user IDs, roles or media URLs from the browser.
Server-only modules must not enter client bundles.

## Environment and database targeting

Use Node 24 to match [CI](ci.md), install with `npm ci`, and provide environment
variables privately. CLI scripts load `.env` via `dotenv/config`; they do not
automatically select `.env.preview`. Next.js also loads its framework env files.
Check injected environment variables and `.env.local` overrides when switching
targets. Do not print connection strings to logs.

| Variable | Used by |
| --- | --- |
| `DATABASE_URL` | Application and operator-script pool, normally a pooled connection. |
| `DATABASE_URL_UNPOOLED` | Prisma CLI migrations; falls back to `DATABASE_URL` in `prisma.config.ts`. Use the direct URL for the same database/branch. |
| `SESSION_SECRET` | Required by session code; use a strong random value, separate per environment. Rotation invalidates existing signed sessions. |
| `CRON_SECRET` | Bearer authentication for the sync endpoint; required in production. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Optional Telegram alert destination. Set both server-only values; send `/start` to the bot before testing delivery. |
| `TMDB_ACCESS_TOKEN`, `RAWG_API_KEY` | Credentials for the default daily catalog sources. |
| `CATALOG_REPLACEMENTS_DAILY` | Enables the optional MangaUpdates and Wikidata tasks. See the [provider guide](provider-review.md) for Open Library and restricted sources. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image uploads. Optional `CLOUDINARY_UPLOAD_FOLDER` defaults to `listiq`. |

Production and preview must have separate database targets and secrets. Both
database URLs in an environment must refer to its own branch. Keep `.env*`,
`.neon` and backup archives outside Git. Existing `neon.ts` leaves existing
branches unchanged; newly created non-default branches receive a seven-day TTL.
Check expiration before using any branch for long-lived preview or recovery.
The app uses its existing JWT cookie authentication; `neon.ts` disables Neon Auth.

## Migrations

On a development database, edit `prisma/schema.prisma`, then create and inspect
the SQL migration:

```sh
npx prisma migrate dev --name describe_change
npm run db:generate
```

Commit schema and migration SQL together. Do not edit an already-applied
migration. Review destructive SQL and use staged, backward-compatible schema
changes for deployments where old and new code can overlap.

For an intended preview/production target:

```sh
npx prisma migrate status
npm run db:migrate
npx prisma migrate status
```

`db:migrate` runs `prisma migrate deploy`; it does not generate the client or seed
data. Migrations install `pg_trgm` and search indexes, so the migration role needs
the appropriate permissions. Never use `migrate reset` or `db push` as a production
release procedure. Validate migration replay on empty PostgreSQL through CI;
validate data-dependent migrations against an isolated representative database.

If migration deployment fails, inspect its SQL, logs and `_prisma_migrations`
before retrying. A deployment failure can leave schema changes applied. Do not
mark a migration resolved until the actual schema matches the intended state.

## Catalog seeding and scoring

Confirm the target database and provider credentials first. These commands write
catalog data and can make many external requests:

```sh
npm run db:generate
node --conditions=react-server --import tsx scripts/seedCatalog.ts curated
node --conditions=react-server --import tsx scripts/catalogStatus.ts
```

Always specify the seed mode and provider. The seed script defaults to a broader
import when no mode is supplied. A single-provider run keeps the request volume
predictable:

```sh
node --conditions=react-server --import tsx scripts/seedCatalog.ts curated tmdb
node --conditions=react-server --import tsx scripts/seedCatalog.ts curated rawg
```

Both seed modes refresh scores automatically. See the [provider guide](provider-review.md)
for supported sources and import restrictions. For scoring only:

```sh
node --conditions=react-server --import tsx scripts/scoreCatalog.ts
node --conditions=react-server --import tsx scripts/catalogStatus.ts
```

Check total/eligible counts by title type, inspect representative titles in
`/titles` and `/discover`, and retain sanitized run counts/duration. A failed
provider does not roll back successful providers. Scoring runs after the imports;
provider failures then cause a nonzero exit. After fixing the cause, rerun the
failed provider instead of restarting every import.

Standalone scripts do not invalidate Next.js caches. After CLI maintenance,
redeploy/restart the application as appropriate for the host's cache lifecycle,
then verify catalog views. The hosted workflow invalidates catalog views when it
finishes, including after partial failure.

`prisma/seed.ts` is a development fixture script: it creates test users with a
shared hard-coded password and synthetic reviews, and updates matching records.
Use the fixture script only on an isolated development database.

## Daily sync and incident handling

Vercel Workflow runs the daily catalog imports and scoring.

- `vercel.json` declares the daily dispatcher at 03:00 UTC and the health check at 07:00 UTC.
- All cron endpoints require `Authorization: Bearer <CRON_SECRET>`, including development. The dispatcher returns 202 and a durable workflow ID.
- The default workflow imports up to 76 pages from TMDB and RAWG, expires and refreshes TMDB cache entries, then scores each title type separately. A section that exhausts its retries marks the run as failed. Other sections continue, and their saved data remains in the catalog. [Provider guide](provider-review.md)
- Provider fetches have a 15-second timeout and at most four attempts. Numeric/date Retry-After is supported; long delays go to durable retries. Workflow steps default to three retries.
- PostgreSQL transaction advisory locking makes daily claims atomic. Active runs block another claim. Heartbeats expire after two hours; inactive runs are fenced from later steps.
- Success skips further daily calls in the same UTC day. Failures can be retried. The health check detects absent/failed jobs, stale heartbeats, runs older than six hours and success older than 36 hours.
- `MONITORING_WEBHOOK_URL` optionally forwards sanitized events to an existing HTTPS receiver. Without a configured receiver or Telegram destination, events stay in logs. Unhealthy checks return 503 regardless of notification transport.
- Alternatively, set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to receive the same sanitized events in Telegram. Alerts contain only environment, operation, error category and timestamp. Delivery failures are logged without tokens, chat contents or exception messages; they do not fail the application request. If both destinations are configured, both receive the event. Actual hosted delivery must be verified before closing the checklist.
- Local QA and integration runners blank external notification destinations, so isolated failures do not send real alerts. `.vercelignore` excludes local env files and runtime artifacts from CLI deployments.
- Authenticated POST to `/api/cron/check-sync` starts a read-only durable/database probe. Poll authenticated GET with `?probe=<workflowRunId>`. A real local probe completed successfully.
- The SDK configures its generated worker's duration for the hosting plan. Verify actual provider-page duration and queue behavior on preview before promoting.

The CLI `npm run sync:titles:daily` remains a long-lived inline runner with the same claim/heartbeat protection. Deep/provider/direct seed commands bypass that daily guard; coordinate those operator commands with the schedule. Standalone scripts do not invalidate Next.js caches; the workflow invalidates catalog/list views at completion.

Inspect catalog counts with `npm run catalog:status`. For a failed sync, check
Vercel Workflow logs for the provider and error category. Retry after resolving
the cause.

Vercel schedules target production; manually verify preview. See [cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs) and [Workflow setup](https://workflow-sdk.dev/docs/getting-started/next).

## Preview and production release

1. Run the checks documented in [CI](ci.md), including migration replay and
   [isolated integration tests](integration-tests.md).
2. Set the preview environment's database pair, session secret, upload credentials
   and catalog/cron credentials. Verify its database branch lifetime.
3. Deploy preview. `vercel.json` selects `npm run vercel-build`, which generates
   Prisma, applies migrations, then builds Next.js with Webpack. A build therefore
   writes to the configured database before deployment becomes available.
4. Verify registration/login/logout over HTTPS, the secure HttpOnly session
   cookie, library/review writes, list ownership/order, Discover saves, profile
   privacy, uploads and moderation restrictions. Check 360, 768 and 1440 px;
   follow [responsive QA](responsive-qa.md) and [UI states](ui-states.md).
5. Before production, confirm the production target pair and recovery point,
   then deploy the reviewed revision. Repeat core-flow checks with disposable
   accounts and verify scheduled-job configuration/logs. Keep the first-admin,
   restore drill and sync-readiness checklist items open until actually verified.

`npm run build` generates Prisma and builds without applying migrations. The
build fetches Google Fonts and needs network access. `npm run test:neon` creates
and removes temporary fixtures over a running server; use it on an isolated
matching database/server pair (optional `SMOKE_BASE_URL`), not casually on live
production.

For an application regression, stop scheduled writers if relevant and restore
the previous compatible deployment. Application rollback does not undo database
migrations. Prefer a forward migration for schema repair; use database recovery
only with a reviewed data-loss window and compatible application revision.

## Backup and recovery drill

For the repeatable local verification used in this workspace:

```sh
npm run db:verify-backup
```

The script requires `DATABASE_URL_UNPOOLED` and PostgreSQL client/server binaries
(default Windows installation: PostgreSQL 18; override with `PG_BIN`). It exports
a read-only source snapshot, creates a custom-format dump, initializes a separate
password-protected loopback-only cluster on a temporary port, restores the dump,
compares row counts and SHA-256 fingerprints for every public table, and checks
`pg_trgm`. The temporary server stops afterwards. The archive and verification
report stay in the printed temporary directory; move the archive to protected
durable storage if it is to be retained as a backup. This check does not validate
Cloudinary recovery or the deployed application's browser flows.

Record the environment, recovery timestamp, current app revision, migration
state, acceptable data-loss window and who performs cutover. Check the actual
Neon retention window before relying on point-in-time history. Restore into an
isolated target first; keep the live target intact during validation.

For a logical archive, install PostgreSQL client tools compatible with the server.
Use direct connections and inject `BACKUP_DATABASE_URL` and
`RESTORE_DATABASE_URL` privately. The latter must point to a new, empty recovery
database, never the running application database. Store archives outside the
repository with restricted access; they contain private application data.

PowerShell example (paths and both target variables must be set by the operator):

```powershell
$archivePath = Join-Path $env:TEMP 'listiq-recovery.dump'
pg_dump --dbname=$env:BACKUP_DATABASE_URL --format=custom --no-owner --no-acl --file=$archivePath
if ($LASTEXITCODE -ne 0) { throw 'Backup failed' }
pg_restore --list $archivePath
if ($LASTEXITCODE -ne 0) { throw 'Archive inspection failed' }
pg_restore --dbname=$env:RESTORE_DATABASE_URL --no-owner --no-acl --exit-on-error $archivePath
if ($LASTEXITCODE -ne 0) { throw 'Restore failed' }
```

Transfer the archive to protected durable storage; a local temp file alone is not
a backup policy. Archive inspection alone is not a restore test. The restore role
must be able to create required objects/extensions, including `pg_trgm`. See
[Neon's pg_dump guide](https://neon.com/docs/manage/backup-pg-dump) for provider
requirements and [branching](https://neon.com/docs/introduction/branching) for
retained-history recovery into a separate branch.

On the isolated restored target, verify migration status and extension/index
presence, compare representative row counts and relationships, then run a
compatible app revision against it. Check login, library, lists, privacy and
catalog reads/writes. Apply any newer migrations only after validating the
restored baseline. Record restore duration, chosen recovery point and results.

Database recovery restores media references, not Cloudinary assets. Verify sample
uploads separately and maintain a media recovery policy. Keep production provider
credentials and scheduled jobs disabled on the recovery app during the drill.

For an actual incident, pause writes and cron before final cutover, account for
writes since the selected recovery point, set both application/migration URLs to
the validated target, and redeploy the matching revision. Recheck core flows,
resume writers and retain the old database until recovery is accepted. A drill
passes after a real restore and application checks.
