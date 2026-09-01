# Future Ideas

## Social Profile

- Turn the profile into a full social-style page.
- Add a dedicated profile wall where users can write posts.
- Allow users to attach their own images and videos to posts.
- Add public profiles with activity, library highlights, ratings, reviews, and custom lists.

## Title Lists

- Let users create their own title lists.
- Example lists: "Summer 2026", "favorite anime", "games to finish", "watch with friends".
- Allow lists to be public or private.
- Add covers, descriptions, and custom sorting inside each list.

## Friends and Social Graph

- Add friend requests and friend lists.
- Show friend activity: what they added, rated, reviewed, watched, read, or played.
- Build a feed around recommendations and events from friends.

## Profile Progression

- Add profile levels and experience points.
- Give experience for adding, rating, and reviewing titles.
- Different title types can give different experience amounts.
- Example: a game gives 40 XP, a movie gives 10 XP.
- Add achievements for activity, streaks, and collections.
- Example achievements: first rating, 100 titles in library, 10 reviews, monthly marathon.

## Tinder for Titles

- Build a swipe mode for discovering new titles.
- Show titles one by one with quick actions: like, dislike, maybe later.
- Use the user's library and ratings to suggest titles they should theoretically enjoy.
- Later, add AI-powered recommendations based on genres, title types, ratings, descriptions, similar users, and activity history.
- Save liked swipe results into a dedicated list or suggest adding them to the library.

## Demo Monetization

- Add a fake subscription system for demo purposes, without real payments.
- Use it to show recruiters that Listiq can be designed as a full product with monetization logic.
- Keep the free plan useful but limited.
- Example: Tinder for Titles gives 5 recommendations per day for free.
- Add a $1 demo plan with 50 recommendations per day.
- Add a $2.99 demo plan with unlimited recommendations.
- Make it clear in the UI that this is a test/demo subscription and no real money is charged.

## Product Direction

- Listiq should grow beyond a catalog into a social network for titles, ratings, personal lists, recommendations, and user progression.

## Privacy Settings

- Allow users to make profiles public, private, or visible only to mutual friends.
- Add privacy controls for reviews.
- Let users make all reviews private.
- Let users make only written review notes private while keeping ratings public.
- Later, add per-post and per-list visibility settings.

## Profile Code Cleanup

- Reduce prop drilling in profile post components.
- Avoid passing current user data through `page -> ProfileWall -> ProfilePostCard -> ProfilePostComments`.
- Consider a small `CurrentUserContext` for profile social UI.
- Consider extracting shared profile post types into a dedicated file.
- Keep post cards server-rendered where possible, but isolate interactive client controls cleanly.
