import type { DashboardTitle } from "./dashboardTypes";

export function getTitleStats(title: DashboardTitle) {
  const ratings = title.users
    .map((entry) => entry.rating)
    .filter((rating): rating is number => rating !== null);

  return {
    libraryCount: title.users.length,
    reviewCount: title.users.filter((entry) => entry.note).length,
    ratingCount: ratings.length,
    averageRating:
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null,
  };
}

export function formatTitleMeta(title: DashboardTitle) {
  return [title.type, title.year].filter(Boolean).join(" | ");
}

export function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function pickRandom<T>(items: T[]) {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function pickRandomFromTop<T>(items: T[], limit = 12) {
  return pickRandom(items.slice(0, limit));
}
