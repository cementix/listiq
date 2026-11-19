import "server-only";

import { prisma } from "@/lib/prisma";

export type SimilarTitle = { id: string; name: string; slug: string; year: number | null; imageUrl: string | null };

/**
 * Titles of the same media type that share genres, best catalog score first;
 * falls back to the top titles of that type when nothing shares a genre.
 */
export async function getSimilarTitles(titleId: string, limit = 12): Promise<SimilarTitle[]> {
  const source = await prisma.title.findUnique({
    where: { id: titleId },
    select: { type: true, genres: { select: { id: true } } },
  });
  if (!source) return [];

  const select = { id: true, name: true, slug: true, year: true, imageUrl: true } as const;
  const base = { id: { not: titleId }, type: source.type, catalogEligible: true, imageUrl: { not: null } };
  const genreIds = source.genres.map((genre) => genre.id);

  const similar = genreIds.length
    ? await prisma.title.findMany({
        where: { ...base, genres: { some: { id: { in: genreIds } } } },
        orderBy: { catalogScore: { sort: "desc", nulls: "last" } },
        select,
        take: limit,
      })
    : [];
  if (similar.length >= 4) return similar;

  const fill = await prisma.title.findMany({
    where: { ...base, id: { notIn: [titleId, ...similar.map((title) => title.id)] } },
    orderBy: { catalogScore: { sort: "desc", nulls: "last" } },
    select,
    take: limit - similar.length,
  });
  return [...similar, ...fill];
}
