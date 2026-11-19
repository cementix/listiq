import "server-only";

import type { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const WEEKS = 26;
const DAY = 24 * 60 * 60 * 1000;

export type InsightTitle = {
  id: string;
  name: string;
  slug: string;
  type: TitleType;
  year: number | null;
  imageUrl: string | null;
  rating: number | null;
};

export type UserInsights = {
  totals: { library: number; rated: number; reviews: number; average: number | null; lists: number };
  ratingBuckets: { score: number; count: number }[];
  byType: { type: TitleType; count: number; average: number | null }[];
  monthly: { key: string; label: string; count: number }[];
  heatmap: { date: string; count: number }[][];
  heatmapMax: number;
  genres: { name: string; count: number }[];
  topRated: InsightTitle[];
  decades: { decade: string; count: number }[];
  streakDays: number;
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Aggregates one member's library and activity into chart-ready series. */
export async function getUserInsights(userId: string): Promise<UserInsights> {
  const now = new Date();
  const heatmapStart = new Date(now.getTime() - (WEEKS * 7 - 1) * DAY);
  heatmapStart.setUTCHours(0, 0, 0, 0);
  // Align the grid so each column is a Monday–Sunday week.
  heatmapStart.setTime(heatmapStart.getTime() - ((heatmapStart.getUTCDay() + 6) % 7) * DAY);

  const [entries, events, lists] = await Promise.all([
    prisma.userTitle.findMany({
      where: { userId },
      select: {
        rating: true,
        note: true,
        createdAt: true,
        title: { select: { id: true, name: true, slug: true, type: true, year: true, imageUrl: true, genres: { select: { name: true } } } },
      },
    }),
    prisma.activityEvent.findMany({
      where: { userId, createdAt: { gte: heatmapStart } },
      select: { createdAt: true },
    }),
    prisma.titleList.count({ where: { userId, systemType: null } }),
  ]);

  const rated = entries.filter((entry) => entry.rating !== null);
  const average = rated.length ? rated.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / rated.length : null;

  const ratingBuckets = Array.from({ length: 10 }, (_, index) => ({
    score: index + 1,
    count: rated.filter((entry) => Math.min(10, Math.max(1, Math.round(entry.rating ?? 0))) === index + 1).length,
  }));

  const typeMap = new Map<TitleType, { count: number; sum: number; rated: number }>();
  for (const entry of entries) {
    const bucket = typeMap.get(entry.title.type) ?? { count: 0, sum: 0, rated: 0 };
    bucket.count += 1;
    if (entry.rating !== null) { bucket.sum += entry.rating; bucket.rated += 1; }
    typeMap.set(entry.title.type, bucket);
  }
  const byType = [...typeMap.entries()]
    .map(([type, bucket]) => ({ type, count: bucket.count, average: bucket.rated ? bucket.sum / bucket.rated : null }))
    .sort((a, b) => b.count - a.count);

  const monthly = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
    const key = date.toISOString().slice(0, 7);
    return {
      key,
      label: date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      count: entries.filter((entry) => entry.createdAt.toISOString().slice(0, 7) === key).length,
    };
  });

  const perDay = new Map<string, number>();
  for (const event of events) perDay.set(dayKey(event.createdAt), (perDay.get(dayKey(event.createdAt)) ?? 0) + 1);
  const heatmap: { date: string; count: number }[][] = [];
  for (let week = 0; week < WEEKS; week++) {
    const column: { date: string; count: number }[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(heatmapStart.getTime() + (week * 7 + day) * DAY);
      if (date > now) break;
      column.push({ date: dayKey(date), count: perDay.get(dayKey(date)) ?? 0 });
    }
    heatmap.push(column);
  }
  const heatmapMax = Math.max(0, ...perDay.values());

  let streakDays = 0;
  for (let cursor = new Date(now); perDay.get(dayKey(cursor)); cursor = new Date(cursor.getTime() - DAY)) streakDays += 1;

  const genreMap = new Map<string, number>();
  for (const entry of entries) for (const genre of entry.title.genres) genreMap.set(genre.name, (genreMap.get(genre.name) ?? 0) + 1);
  const genres = [...genreMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const decadeMap = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.title.year) continue;
    const decade = `${Math.floor(entry.title.year / 10) * 10}s`;
    decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + 1);
  }
  const decades = [...decadeMap.entries()].map(([decade, count]) => ({ decade, count })).sort((a, b) => a.decade.localeCompare(b.decade));

  const topRated = rated
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6)
    .map((entry) => ({ ...entry.title, rating: entry.rating }));

  return {
    totals: { library: entries.length, rated: rated.length, reviews: entries.filter((entry) => entry.note?.trim()).length, average, lists },
    ratingBuckets,
    byType,
    monthly,
    heatmap,
    heatmapMax,
    genres,
    topRated,
    decades,
    streakDays,
  };
}
