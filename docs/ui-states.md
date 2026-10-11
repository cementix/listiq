# UI states and submission guards

Next route boundaries provide loading skeletons, a safe error message with
`Try again`, and a shared 404 for unknown or inaccessible pages. Protected and
moderation pages keep their navigation when a page fails. `global-error.tsx`
also handles root-layout failures without depending on the normal layout.
Raw server errors are never displayed to users.

Empty collections retain their existing messages. Own lists now explain how
to get started. Failed list-option searches and catalog pagination offer a retry
instead of showing a false empty state or leaving a spinner running.

## Mutations

`lib/hooks/use-mutation.ts` uses a synchronous single-flight lock per control:
repeated calls are ignored until the original promise settles. It supplies
pending state, reports unexpected failures, and releases the lock for retries.
Forms, library actions, lists, moderation, likes and uploads use it. Discover
shares one synchronous lock between choices and filter requests. Login and
registration retain React action state with a synchronous submit guard.

This prevents repeated UI submissions in one mounted control. It does not
provide server idempotency across browser tabs, page reloads or network retries.
Existing server authorization, validation and database constraints still apply.

Run `npm run test:ui` for four tests covering concurrent duplicate calls,
retry after async/synchronous failures, and independent controls.

## Manual browser checks — 2026-10-11

- Unknown route and missing title render the custom 404.
- Actual route transitions display the loading fallback.
- A temporary page intentionally threw a render error; the protected boundary
  retained navigation and `Try again` restored the page. The temporary route
  was removed after verification.
- A catalog search with no matches displays its empty state.
- Enter opens Create list; Tab/Shift+Tab loop inside; Escape closes it and
  returns focus to New list.
- Type selection opens with Enter; ArrowDown and Enter select an option.
- Desktop navigation opens with ArrowDown; Escape closes it.
- Skip to content focuses the main landmark.
- Tab leaves the comment textarea and focuses Send comment. No comment was
  submitted. IME composition no longer triggers Enter submission.

TypeScript, ESLint on changed/new TS files, the UI tests and `git diff --check`
were run. This is not full e2e coverage: auth failure submissions, root-layout
failure recovery and transport failures for every action still need isolated
integration tests. No user data was saved during browser checks.

Next boundary conventions follow the [official error-handling documentation](https://nextjs.org/docs/app/getting-started/error-handling).
