# Continuous integration

`.github/workflows/ci.yml` runs on pushes, pull requests and manual dispatch.
The `Typecheck, lint, tests and build` check uses Node 24, `npm ci` and a fresh
PostgreSQL 17 service with no production credentials or repository secrets.

Checks run in order:

1. Generate the Prisma client (`npm run db:generate`).
2. Replay every committed migration on the empty service database (`npm run db:migrate`).
3. Typecheck (`npm run typecheck`) and lint (`npm run lint`).
4. Run unit tests (`npm test`).
5. Run integration tests (`npm run test:integration`), which create, migrate and
   remove another isolated database. See [integration tests](integration-tests.md).
6. Build the production application (`npm run build`).

PostgreSQL includes `pg_trgm`; migrations install the extension. The service user
can create the temporary integration database. Each job starts with a fresh
service; no database state is shared between runs. The session secret is a public
CI-only placeholder. Upload and catalog provider keys are unnecessary for these
checks. The build fetches Google Fonts and therefore requires internet access.

A failed command fails the check. Superseded runs on the same ref are cancelled;
jobs time out after 20 minutes. npm's download cache is reused, while generated
Prisma files and build output are created from scratch.

After the first successful GitHub run, require this check in the branch protection
rules for the default branch. Adding the workflow does not enable branch protection
or deploy the application. Production migrations remain a separate deployment step.

For local checks, use the same commands. Only run `db:migrate` against a database
you intend to migrate; the integration runner independently guards its temporary
database. Never point CI connection variables at production or preview databases.

Service setup follows [GitHub's PostgreSQL service documentation](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).

Local validation: Prisma generation, typecheck, full lint, 42 unit tests,
20 integration tests, replay of all 29 migrations on an empty temporary database,
and production build passed. The hosted workflow still needs its first GitHub run.
