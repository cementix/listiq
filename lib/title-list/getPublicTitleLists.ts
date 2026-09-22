import "server-only";

import { requireUserServer } from "@/actions/auth";
import { TitleListVisibility } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type PublicTitleListSort = "newest" | "popular";

type GetPublicTitleListsInput = {
  query?: string;
  sort?: PublicTitleListSort;
  page?: number;
  limit?: number;
};

export async function getPublicTitleLists({
  query = "",
  sort = "newest",
  page = 1,
  limit = 24,
}: GetPublicTitleListsInput = {}) {
  const { session } = await requireUserServer();
  const normalizedQuery = query.trim();
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 48);
  const skip = (safePage - 1) * safeLimit;

  const orderBy =
    sort === "popular"
      ? [{ items: { _count: "desc" as const } }, { updatedAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const lists = await prisma.titleList.findMany({
    where: {
      visibility: TitleListVisibility.PUBLIC,
      systemType: null,
      ...(normalizedQuery
        ? {
            OR: [
              {
                title: {
                  contains: normalizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: normalizedQuery,
                  mode: "insensitive" as const,
                },
              },
              {
                user: {
                  username: {
                    contains: normalizedQuery,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy,
    select: {
      id: true,
      userId: true,
      title: true,
      slug: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { username: true, avatarUrl: true },
      },
      savedBy: {
        where: { userId: session.userId },
        select: { id: true },
        take: 1,
      },
      _count: {
        select: { items: true },
      },
      items: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          title: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              users: {
                where: { userId: session.userId },
                select: { rating: true },
                take: 1,
              },
            },
          },
        },
      },
    },
    skip,
    take: safeLimit + 1,
  });

  const hasMore = lists.length > safeLimit;

  return {
    lists: lists.slice(0, safeLimit).map((list) => {
      const completed = list.items.filter(
        (item) => item.title.users.length > 0,
      ).length;
      const ratings = list.items
        .map((item) => item.title.users[0]?.rating)
        .filter((rating): rating is number => typeof rating === "number");

      return {
        id: list.id,
        title: list.title,
        slug: list.slug,
        description: list.description,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        user: list.user,
        _count: list._count,
        items: list.items.slice(0, 4),
        isOwner: list.userId === session.userId,
        isSaved: list.savedBy.length > 0,
        viewer: {
          completedCount: completed,
          totalCount: list.items.length,
          completionPercentage: list.items.length
            ? Math.round((completed / list.items.length) * 100)
            : 0,
          averageRating: ratings.length
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : null,
        },
      };
    }),
    hasMore,
    nextPage: hasMore ? safePage + 1 : null,
  };
}
