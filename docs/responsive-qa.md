# Responsive UI checks

Checked locally in the Codex browser on 2026-10-11, using the existing catalog
and an authenticated admin account. These are manual browser checks, not an
automated e2e suite.

## Page coverage

Each route below loaded at **360, 768 and 1440 CSS px**, with no horizontal page
overflow (`documentElement.scrollWidth === documentElement.clientWidth`).

| Screen | Route | Result |
| --- | --- | --- |
| Dashboard | `/dashboard` | Pass |
| Catalog | `/titles` | Pass |
| Title details | `/titles/portal` | Pass |
| Profile | `/users/cementix` | Pass |
| Profile settings | `/settings/profile` | Pass |
| Public lists | `/lists` | Pass |
| Own lists | `/my-lists` | Pass |
| List details | `/lists/cementix/saved-for-later` | Pass |
| Discover | `/discover` | Pass |
| Title submission form | `/add-title` | Pass |
| Own submissions | `/my-submissions` | Pass, empty state |
| Review queue | `/submissions` | Pass, empty state |
| Landing page | `/` | Pass |
| Login | `/login` | Pass |
| Registration | `/register` | Pass |

The browser used 110% zoom. Viewport overrides were adjusted and `innerWidth`
was inspected to verify the actual CSS widths. Heights were 800, 1000 and
900 CSS px respectively; short-screen checks also used 360 × 500.

## Interaction checks

- Mobile navigation opens, scrolls and closes with Escape. Links close the menu.
- Desktop Titles dropdown opens above dashboard artwork and exposes its links.
- Create-list dialog fits 360 × 500 with internal scrolling and a visible close control.
- Add-titles dialog opens and searches the existing catalog without horizontal overflow.
- Profile banner editor opens within the mobile viewport.
- Save-to-list popover stays within the phone viewport and lists existing choices.
- Discover action buttons remain above the bottom navigation at 360 × 800.
- Tablet title layout keeps the poster and entry panel in separate columns.
- Login and registration remain usable at 360 × 500 without clipping the page.
- Visible inputs use 16 px text below 1024 px, including at 768 px.

No posts, lists, settings, ratings or uploads were saved during checks. Visiting
Discover uses its existing seen-title tracking. The browser was signed out to
check guest pages after authenticated checks finished.

## Code validation

- `node node_modules/typescript/bin/tsc --noEmit --incremental false` — pass.
- ESLint on changed TypeScript/TSX files — pass.
- `git diff --check` — pass.

## Before production

Still smoke-test on a physical iPhone/Android device: keyboard opening, safe-area
insets, touch swipes, drag sorting and media cropping. Browser resizing does not
verify those device behaviors. Populated moderation cards, uploaded-media viewer
and mutation success/error states were not exercised with new test data here.
