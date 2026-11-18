import "server-only";

import type { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type YearInReview = {
  year: number;
  total: number;
  rated: number;
  reviews: number;
  average: number | null;
  topType: { type: TitleType; count: number } | null;
  topGenre: { name: string; count: number } | null;
  busiestMonth: { label: string; count: number } | null;
  favourites: { id: string; name: string; slug: string; imageUrl: string | null; rating: number }[];
  generosity: "generous" | "balanced" | "tough";
  typesTried: number;
};

/** Summarises everything a member added to their library in one calendar year. */
export async function getYearInReview(userId: string, year: number): Promise<YearInReview> {
  const entries = await prisma.userTitle.findMany({
    where: { userId, createdAt: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
    select: {
      rating: true,
      note: true,
      createdAt: true,
      title: { select: { id: true, name: true, slug: true, imageUrl: true, type: true, genres: { select: { name: true } } } },
    },
  });

  const rated = entries.filter((entry) => entry.rating !== null);
  const average = rated.length ? rated.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / rated.length : null;

  const tally = <K extends string>(keys: K[]) => {
    const counts = new Map<K, number>();
    for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const types = tally(entries.map((entry) => entry.title.type));
  const genres = tally(entries.flatMap((entry) => entry.title.genres.map((genre) => genre.name)));
  const months = tally(entries.map((entry) => String(entry.createdAt.getUTCMonth())));

  const favourites = rated
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5)
    .map((entry) => ({ ...entry.title, rating: entry.rating ?? 0 }));

  return {
    year,
    total: entries.length,
    rated: rated.length,
    reviews: entries.filter((entry) => entry.note?.trim()).length,
    average,
    topType: types[0] ? { type: types[0][0], count: types[0][1] } : null,
    topGenre: genres[0] ? { name: genres[0][0], count: genres[0][1] } : null,
    busiestMonth: months[0]
      ? { label: new Date(Date.UTC(year, Number(months[0][0]), 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" }), count: months[0][1] }
      : null,
    favourites,
    generosity: average === null ? "balanced" : average >= 8.5 ? "generous" : average <= 6.5 ? "tough" : "balanced",
    typesTried: types.length,
  };
}
