"use server";

import { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";
import { normalizeTitleAlias } from "@/lib/sync/titleAliases";
import { findFuzzyTitleIds } from "@/lib/title/findFuzzyTitleIds";
import { getPublicTitleStats } from "@/lib/title/getPublicTitleStats";
import { getRankedTitleIds } from "@/lib/title/getRankedTitleIds";
import { sourceLinkSelect } from "@/lib/catalog/attribution";

type TitleSort =
  | "newest"
  | "popular"
  | "highest-rated"
  | "most-reviewed"
  | "recently-added";

type GetTitlesInput = {
  query?: string;
  type?: TitleType | "ALL";
  sort?: TitleSort;
  page?: number;
  limit?: number;
  searchMode?: "literal" | "fuzzy";
};

export async function getTitles({
  query = "",
  type = "ALL",
  sort = "newest",
  page = 1,
  limit = 24,
  searchMode = "literal",
}: GetTitlesInput) {
  const { session } = await requireUserServer();
  const normalizedQuery = query.trim();
  const normalizedAliasQuery = normalizeTitleAlias(normalizedQuery);

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 48);
  const skip = (safePage - 1) * safeLimit;

  const fuzzyIds =
    searchMode === "fuzzy" && normalizedQuery.length >= 3
      ? await findFuzzyTitleIds(normalizedQuery, type, skip, safeLimit + 1)
      : null;

  const rankedIds =
    fuzzyIds === null && sort !== "newest"
      ? await getRankedTitleIds({
          sort,
          limit: safeLimit + 1,
          offset: skip,
          query: normalizedQuery,
          aliasQuery: normalizedAliasQuery,
          type,
        })
      : null;

  const orderedIds = fuzzyIds ?? rankedIds;

  const titles = await prisma.title.findMany({
    where: {
      ...(orderedIds !== null
        ? { id: { in: orderedIds } }
        : normalizedQuery
          ? {
              OR: [
                {
                  name: {
                    contains: normalizedQuery,
                    mode: "insensitive" as const,
                  },
                },
                {
                  aliases: {
                    some: {
                      normalizedValue: {
                        contains: normalizedAliasQuery,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      ...(type !== "ALL" ? { type } : {}),
    },
    orderBy:
      orderedIds === null
        ? [{ createdAt: "desc" as const }, { id: "desc" as const }]
        : undefined,
    include: {
      externalTitles: { select: sourceLinkSelect },
      genres: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      users: {
        select: {
          id: true,
          userId: true,
          rating: true,
          note: true,
          createdAt: true,
          user: {
            select: {
              libraryPublic: true,
              reviewsPublic: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    skip: orderedIds === null ? skip : undefined,
    take: orderedIds === null ? safeLimit + 1 : undefined,
  });

  const orderedTitles =
    orderedIds === null
      ? titles
      : [...titles].sort(
          (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id),
        );

  const hasMore = orderedTitles.length > safeLimit;
  const visibleTitles = orderedTitles.slice(0, safeLimit);

  const titlesWithStats = visibleTitles.map((title) => {
    const { users, ...publicTitle } = title;
    const ownEntry = users.find((entry) => entry.userId === session.userId);

    return {
      ...publicTitle,
      currentUserTitle: ownEntry
        ? {
            id: ownEntry.id,
            userId: ownEntry.userId,
            rating: ownEntry.rating,
            note: ownEntry.note,
            createdAt: ownEntry.createdAt,
          }
        : null,
      stats: getPublicTitleStats(users),
    };
  });

  return {
    titles: titlesWithStats,
    hasMore,
    nextPage: hasMore ? safePage + 1 : null,
  };
}
