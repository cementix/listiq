# Reminders 07.08

## Previous Direction

- The product direction is: catalog, title details, ratings, profile, activity, public social profiles, custom lists, recommendations, and later progression.
- The profile is becoming the social center of Listiq, not just an account page.
- `future-ideas.md` is the long-term roadmap file.

## What Was Done Previously

- Added a real profile activity feed backed by `ActivityEvent`.
- Updated profile data fetching to include recent activity events.
- Changed profile activity from raw recent library entries to real activity events.
- Made recent activity and latest reviews more compact.
- Added expandable older activity and older reviews.
- Added profile revalidation after library toggles, title rating/review updates, and title submissions.
- Added user fields for avatar and banner images in Prisma.
- Created the `add_profile_images` migration.
- Regenerated the Prisma client.
- Added avatar/banner fields to the profile overview query.
- Added the first `updateProfileImages` action.

## What We Did Today

- Finished the profile avatar/banner customization flow.
- Made avatar editing happen inline from the profile header instead of through a separate settings-style card.
- Made banner editing happen from a hover pencil button on the banner.
- Reused the Cloudinary upload flow for profile images.
- Adjusted crop ratios:
  - avatar: 1:1 square crop.
  - banner: wide banner crop.
- Improved the image upload UX so profile images save immediately after applying the crop.
- Fixed the profile header so saved avatar/banner images actually render instead of the default user icon and gradient.
- Updated the image preview modal so avatar previews are square and banner previews stay wide.
- Removed the email from the visible profile header.
- Replaced the email line with profile-safe public metadata.
- Added the idea of role styling:
  - Member/User: default blue.
  - Moderator: blue-green/cyan.
  - Admin: yellow/gold.
  - Verified: green.
- Added relative joined text such as `today`, `2 days ago`, `a week ago`, `a month ago`, and `a year ago`.
- Started redesigning the protected navbar.
- Removed dashboard/profile as primary nav links from the main nav concept.
- Made `titles` the main product entry point.
- Added dropdown navigation for:
  - Titles: browse titles, add title.
  - Submissions: my submissions, add submission, review queue.
- Added the current user's avatar beside the username in the right side of the navbar.
- Added a hide-on-scroll-down / show-on-scroll-up navbar shell.
- Fixed the global layout issue where `overflow-hidden` and `backdrop-blur-xl` could interfere with fixed navbar behavior.

## Important Notes

- Profile image updates should remain partial.
- `undefined` should mean "do not touch this field".
- `null` or an empty string should mean "clear this field".
- Updating only the avatar must not overwrite banner fields.
- Updating only the banner must not overwrite avatar fields.
- The visible profile page should not show user email.
- Public profiles must never expose private account data such as email.
- The protected navbar should use `fixed` behavior through `NavbarShell`, with top padding in the protected layout.
- The global root layout should avoid wrapping the full app in `overflow-hidden` or backdrop blur when fixed UI needs to work correctly.

## Small UI Idea To Keep

- Add a small animated SVG underline effect under the `listiq` logo in the left side of the navbar.
- Trigger it on hover.
- Possible direction: a thin neon/ink stroke quickly draws from left to right, then fades or slides away.
- Keep it subtle and premium, not goofy or overanimated.

## Next Things To Do

- Replace the `Browse titles` infinite `Load more` flow with URL-based pagination.
  - Store the current page in the `page` search parameter alongside `q`, `type`, and `sort`.
  - Load one stable page at a time instead of accumulating title batches in client state.
  - Preserve filters when navigating between pages and support browser back/forward navigation.
- Audit the existing `actions/` directory and separate real Server Actions from internal server code.
  - Keep functions called directly from client components or forms in `actions/` and mark them with `"use server"`.
  - Move database helpers, queries, slug generators, and other internal server functions to the appropriate `lib/` domain folder and guard database-backed modules with `import "server-only"`.
  - Update imports after moving files and verify that no client component imports an internal server module.
- Build public profiles for other users.
- Add a route like `/users/[username]` or `/profile/[username]`.
- Public profiles should reuse the current profile layout but remove editing controls.
- Public profiles should show:
  - username.
  - avatar.
  - banner.
  - role badge.
  - relative joined date.
  - public stats.
  - recent activity.
  - latest reviews.
- Public profiles should not show:
  - email.
  - private account data.
  - avatar/banner edit controls.
- Decide whether the current private profile route should stay `/profile` and public profiles should be `/users/[username]`.
- Add links from usernames/activity items to public profiles later.
- Clean up old unused files such as `ProfileImagesForm.tsx` if it is no longer used.
- Clean up unused imports in `profile/page.tsx` and `Navbar.tsx`.
- Polish navbar dropdown spacing and hover behavior.
- Consider mobile navbar behavior later.
- Add the animated `listiq` logo underline.
- Consider extracting relative date formatting into a helper.
- Consider extracting role labels/styles into a helper.
- Decide later whether old Cloudinary images should be deleted when a user replaces or removes avatar/banner images.
- Run lint once the current UI batch is stable.

## Lists MVP Follow-ups

- Add owner controls to edit/delete a list and remove titles directly on its page.
- Add a popular/new lists rail to the dashboard and lists to public profiles.
- Decide whether public lists should be readable without signing in; the current route is protected.
- Keep list completion and rating stats fresh after library/rating changes, and optimize aggregation for larger lists.
- Add a save control on the canonical list page; currently it is available from browse cards.
- Revisit dependency audit findings (`next`, unused `next-auth`) before production deployment.
- Add automated tests and Docker setup after the MVP merge.

## Future Product Direction

- Build public social-style profiles.
- Add a profile wall with posts.
- Allow users to attach images and videos to posts.
- Polish custom title lists and surface them across the product.
- Add friends and friend activity.
- Add profile XP, levels, and achievements.
- Build Tinder for Titles with AI-assisted recommendations.
- Add fake subscription tiers for recommendation limits as a product/monetization demo.

## Suggested Commit Names

- `feat: add inline profile image customization`
- `feat: polish profile header and navbar`
- `feat: add profile media editing and navbar polish`
