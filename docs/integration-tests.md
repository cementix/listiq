# Database integration tests

```sh
npm run test:integration
```

Prerequisites: installed dependencies, generated Prisma client (`npx prisma
generate`), and local PostgreSQL. The connecting role needs `CREATEDB` and
permission to install `pg_trgm`, which the migrations use.

The runner reads `TEST_DATABASE_ADMIN_URL`, falling back to `DATABASE_URL` in
`.env`. Only localhost/loopback PostgreSQL URLs are accepted. For a dedicated
test server, set `TEST_DATABASE_ADMIN_URL` to its local connection string;
never commit credentials. No Docker dependency is required.

## Isolation

Each run creates a fresh `listiq_test_<random UUID>` database, applies all
committed migrations, and starts a separate test process with its URL and a
fresh session signing secret. Fixtures are reset between sequential test cases.
Concurrent operations within a test use real PostgreSQL transactions.

The supplied development database is never migrated, seeded or truncated.
Cleanup drops only the database created by that run, including after a test or
migration failure. An abrupt process kill can leave a temporary database behind;
inspect its name/ownership before removing it manually.

Database fixtures also verify `current_database()` before any truncate. Running
`database.test.ts` directly without the runner fails the isolation guard.

Only Next request cookies/headers and cache invalidation are replaced. JWT
verification, auth guards, action validation, privacy queries, scoring,
constraints and persistence all execute their production implementations.
This is integration coverage, not a browser e2e suite.

## Coverage

- Anonymous, forged and deleted-user sessions; role checks for regular,
  verified, moderator and admin accounts; role changes in the database.
- Ownership checks for library entries, list contents/order/metadata/deletion;
  protection of system-list metadata.
- Owner/guest/stranger profile visibility and all **64 privacy-flag
  combinations**; reviews, attached posts, activity, lists and public title stats.
- Private list access/bookmarks and unauthorized likes/comments on private posts.
- Catalog score persistence, eligibility reset, repeat scoring and preservation
  of user reviews/ratings.
- Concurrent library add/remove and mixed changes; atomic rollback of items and
  activity events; duplicate review-write events.
- Concurrent list appends, duplicate saves, removals and reorders; shared regular
  mutations/Discover saves; first system-list creation and occupied slugs.

Two race tests hold a database row lock until both worker requests are waiting.
This reproduces overlap deliberately rather than hoping scheduling exposes it.

## Fixes caught by the suite

Identical review writes previously read the same old value and recorded duplicate
events. They now lock the library entry before comparing and updating it.
List removal and reorder now use the same owned-list lock as append; metadata
updates/deletion follow the same ordering.

Concurrent first Discover saves exposed an emulated compound-key upsert race.
System-list creation now uses native conflict-safe inserts and reads the winning
list, with a different slug when a regular list already occupies the default.

Verified on 2026-10-11: **20 integration tests**, all **29 migrations** on a fresh
database, and **42 existing unit tests** passed. TypeScript and targeted ESLint
were also checked. This does not exercise Vercel, real browser cookies or external
provider requests; browser e2e and CI are separate checklist items.

For the separation of integration tests from unit tests, see the
[Prisma integration-testing guide](https://www.prisma.io/docs/orm/v7/prisma-client/testing/integration-testing).
