# Reminders 07.08

## What We Did In This Chat

- Reviewed the previous commit history and recovered the old product TODO from git history.
- Identified the current product direction: catalog, title details, ratings, profile, activity, and future social features.
- Added a real profile activity feed backed by `ActivityEvent`.
- Updated profile data fetching to include recent activity events.
- Changed profile activity from raw recent library entries to real activity events.
- Made recent activity more compact.
- Added expandable older activity.
- Made latest reviews more compact.
- Added expandable older reviews.
- Added profile revalidation after library toggles, title rating/review updates, and title submissions.
- Added `future-ideas.md` as the product roadmap file.
- Added future ideas for social profiles, profile wall posts, custom title lists, friends, profile levels, XP, achievements, Tinder-style title discovery, AI recommendations, and fake demo monetization.
- Added a fake subscription idea for recruiter demos: free 5 recommendations/day, $1 for 50/day, $2.99 for unlimited recommendations.
- Started profile image customization.
- Added user fields for avatar and banner images in Prisma.
- Created the `add_profile_images` migration.
- Regenerated the Prisma client.
- Added avatar/banner fields to the profile overview query.
- Started `updateProfileImages`, but the first version needs a partial-update fix.

## Important Notes

- Profile image updates should be partial.
- `undefined` should mean "do not touch this field".
- `null` or an empty string should mean "clear this field".
- A user should be able to update only the banner without re-uploading the avatar, and vice versa.
- Avoid overwriting avatar fields when only banner fields are submitted.
- Avoid overwriting banner fields when only avatar fields are submitted.

## Next Things To Return To

- Fix `actions/profile/updateProfileImages.ts` so it builds update data only for fields that were actually passed.
- Build the UI for changing the profile avatar.
- Build the UI for changing the profile banner.
- Reuse the existing Cloudinary upload flow, but adjust crop ratios:
  - avatar: square crop.
  - banner: wide crop.
- Consider extracting a reusable image upload/crop component instead of forcing `CoverImageField` to handle every profile-image use case.
- Show the avatar in the profile header instead of the default user icon.
- Show the banner image behind the profile header instead of the current gradient.
- Add remove buttons for avatar and banner.
- Run lint after the profile image flow is wired.
- Check TypeScript errors around the new profile image action.
- Decide whether profile image uploads should delete old Cloudinary assets later.

## Future Product Direction

- Build public social-style profiles.
- Add a profile wall with posts.
- Allow users to attach images and videos to posts.
- Add custom title lists like "Summer 2026".
- Add friends and friend activity.
- Add profile XP, levels, and achievements.
- Build Tinder for Titles with AI-assisted recommendations.
- Add fake subscription tiers for recommendation limits as a product/monetization demo.

## Suggested Commit Names

- `feat: add profile images foundation and roadmap`
- `feat: enhance profile and add future roadmap`
- `feat: add profile customization groundwork`
