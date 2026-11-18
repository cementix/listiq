import "server-only";

import { cache } from "react";

import { sourceLinkSelect } from "@/lib/catalog/attribution";
import { prisma } from "@/lib/prisma";
import { getPublicTitleStats } from "@/lib/title/getPublicTitleStats";

/** Read-only title data safe to show signed-out visitors: only public reviews and counts. */
export const getPublicTitle = cache(async (slug: string) => {
  const title = await prisma.title.findFirst({
    where: { slug, catalogEligible: true },
    select: {
      id: true, name: true, slug: true, type: true, year: true, description: true, imageUrl: true, backdropUrl: true,
      genres: { select: { id: true, name: true } },
      externalTitles: { select: sourceLinkSelect },
      users: {
        where: { user: { isGuest: false } },
        select: {
          rating: true,
          note: true,
          updatedAt: true,
          user: { select: { username: true, libraryPublic: true, reviewsPublic: true } },
        },
      },
    },
  });
  if (!title) return null;

  const stats = getPublicTitleStats(title.users);
  const reviews = title.users
    .filter((entry) => entry.user.reviewsPublic && entry.note?.trim())
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6)
    .map((entry) => ({ username: entry.user.username, rating: entry.rating, note: entry.note!.trim() }));

  const { users: _entries, ...rest } = title;
  void _entries;
  return { ...rest, stats, reviews };
});

/** Most notable catalog titles, for the sitemap. */
export async function getSitemapTitles(limit = 500) {
  return prisma.title.findMany({
    where: { catalogEligible: true, imageUrl: { not: null } },
    orderBy: { catalogScore: { sort: "desc", nulls: "last" } },
    select: { slug: true, updatedAt: true },
    take: limit,
  });
}
