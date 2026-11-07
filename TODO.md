# Release checklist

## Catalog sync

- [x] Configure production schedules, cron authentication, and Telegram alerts.
- [x] Verify Preview dispatch and confirm that successful imports persist when another provider fails.
- [ ] Verify a complete Preview run after RAWG recovers. The last run saved TMDB, MangaUpdates, and Wikidata titles but failed on RAWG.
- [ ] Verify the next automatic production run and its health check after deployment.
- [ ] Enable optional providers in production after Preview verification. Follow the [provider guide](docs/provider-review.md).

## Release verification

- [x] Configure separate Preview and Production databases and run an isolated restore drill.
- [x] Set up CI for migration replay, type checking, lint, tests, and builds.
- [ ] Verify the deployed app on mobile and desktop. Cover sign-up, sign-in, sign-out, uploads, library and review edits, lists, Discover, privacy, and moderation permissions.

See the [operations guide](docs/operations.md) for deployment and recovery steps.
