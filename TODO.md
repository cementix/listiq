# Launch checklist

## Access & architecture

- [+] Hide moderation links for regular users; enforce roles and ownership in server actions.
- [+] Verify privacy across profiles, reviews, posts, activity and title stats.
- [+] Move auth guards, queries, validation and helpers into domain modules in `lib`; keep `actions` thin. Remove `lib → actions` imports.
- [x] Share library/list mutations between regular UI and Discover; save mutations and activity events in one transaction.
- [x] Separate catalog import, scoring and persistence; remove unused code and fix cache invalidation paths.
- [x] Consolidate Cloudinary uploads; add auth, file limits, resource ownership checks and rate limiting for auth/uploads/posts.

## UI & tests

- [x] Build touch-friendly mobile navigation; fix key screens and dialogs at 360, 768 and 1440 px.
- [x] Add loading, empty, error and 404 states; prevent duplicate submissions and check keyboard navigation.
- [x] Test permissions, privacy, scoring and concurrent library/list writes against isolated test data.
- [x] Add e2e coverage: signup/login, library/reviews, lists, Discover and moderation restrictions.
- [x] Add CI: Prisma generation, typecheck, lint, tests, production build and migration replay on empty PostgreSQL.

## Database & deployment

- [ ] Set up cloud PostgreSQL with `pg_trgm`, connection pooling and separate production/preview databases.
- [ ] Configure Vercel env variables, Prisma generation and a production migration step (`migrate deploy`).
- [ ] Seed and score the catalog; create the first admin securely and verify database backup restoration.
- [ ] Schedule daily title sync; verify runtime limits, overlapping-run protection, retries, score refresh and failure alerts.
- [ ] Deploy preview, then production; verify auth cookies, uploads and core flows on mobile and desktop.

## Docs & operations

- [ ] Replace README with setup, commands, screenshots and feature overview; add a safe `.env.example`.
- [ ] Document module boundaries, migrations, catalog seeding, sync schedule, deployment and recovery steps.
- [ ] Add error monitoring without secrets/private data in logs; check provider attribution requirements and prepare public demo data.
