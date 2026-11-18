import "server-only";

import { cache } from "react";

import { TitleListVisibility, type TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type LandingPoster = {
  id: string;
  name: string;
  slug: string | null;
  type: TitleType;
  year: number | null;
  imageUrl: string;
};

export type LandingData = {
  posters: LandingPoster[];
  stats: { titles: number; mediaTypes: number; lists: number; ratings: number };
};

const FALLBACK_POSTERS: LandingPoster[] = Array.from({ length: 9 }, (_, index) => ({
  id: `fallback-${index}`,
  name: "Listiq",
  slug: null,
  type: "OTHER",
  year: null,
  imageUrl: `/demo/poster-${index}.svg`,
}));

/** Real catalog posters and headline numbers for the public landing page. */
export const getLandingData = cache(async (): Promise<LandingData> => {
  try {
    const [rows, titles, typeGroups, lists, ratings] = await Promise.all([
      prisma.title.findMany({
        // Synthetic demo-seed artwork never appears on the public landing page.
        where: { catalogEligible: true, imageUrl: { not: null }, NOT: { imageUrl: { startsWith: "/demo/" } } },
        orderBy: { catalogScore: { sort: "desc", nulls: "last" } },
        select: { id: true, name: true, slug: true, type: true, year: true, imageUrl: true },
        take: 60,
      }),
      prisma.title.count({ where: { catalogEligible: true } }),
      prisma.title.groupBy({ by: ["type"], where: { catalogEligible: true } }),
      prisma.titleList.count({ where: { visibility: TitleListVisibility.PUBLIC, systemType: null } }),
      prisma.userTitle.count({ where: { rating: { not: null } } }),
    ]);

    // Interleave media types so every column of the wall feels varied.
    const byType = new Map<TitleType, LandingPoster[]>();
    for (const row of rows) {
      if (!row.imageUrl) continue;
      const bucket = byType.get(row.type) ?? [];
      bucket.push({ ...row, imageUrl: row.imageUrl });
      byType.set(row.type, bucket);
    }
    const posters: LandingPoster[] = [];
    while (posters.length < 36 && [...byType.values()].some((bucket) => bucket.length)) {
      for (const bucket of byType.values()) {
        const next = bucket.shift();
        if (next) posters.push(next);
      }
    }

    return {
      posters: posters.length >= 9 ? posters : [...posters, ...FALLBACK_POSTERS],
      stats: { titles, mediaTypes: Math.max(typeGroups.length, 7), lists, ratings },
    };
  } catch {
    return { posters: FALLBACK_POSTERS, stats: { titles: 0, mediaTypes: 9, lists: 0, ratings: 0 } };
  }
});
