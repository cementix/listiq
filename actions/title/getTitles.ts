"use server";

import { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";

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
};

export async function getTitles({
  query = "",
  type = "ALL",
  sort = "newest",
  page = 1,
  limit = 24,
}: GetTitlesInput) {
  const { session } = await requireUserServer();
  const normalizedQuery = query.trim();

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 48);
  const skip = (safePage - 1) * safeLimit;

  const titles = await prisma.title.findMany({
    where: {
      ...(normalizedQuery
        ? {
            name: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          }
        : {}),
      ...(type !== "ALL" ? { type } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
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
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    skip,
    take: safeLimit + 1,
  });

  const hasMore = titles.length > safeLimit;
  const visibleTitles = titles.slice(0, safeLimit);

  const titlesWithStats = visibleTitles.map((title) => {
    const ratings = title.users
      .map((entry) => entry.rating)
      .filter((rating): rating is number => rating !== null);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null;

    return {
      ...title,
      currentUserTitle:
        title.users.find((entry) => entry.userId === session.userId) ?? null,
      stats: {
        libraryCount: title.users.length,
        ratingCount: ratings.length,
        averageRating,
        reviewCount: title.users.filter((entry) => entry.note).length,
      },
    };
  });

  const sortedTitles = [...titlesWithStats].sort((a, b) => {
    if (sort === "popular") {
      return (
        b.stats.libraryCount - a.stats.libraryCount ||
        b.createdAt.getTime() - a.createdAt.getTime()
      );
    }

    if (sort === "highest-rated") {
      return (
        (b.stats.averageRating ?? 0) - (a.stats.averageRating ?? 0) ||
        b.stats.ratingCount - a.stats.ratingCount ||
        b.createdAt.getTime() - a.createdAt.getTime()
      );
    }

    if (sort === "most-reviewed") {
      return (
        b.stats.reviewCount - a.stats.reviewCount ||
        b.createdAt.getTime() - a.createdAt.getTime()
      );
    }

    if (sort === "recently-added") {
      const aLastAdded =
        a.users[0]?.createdAt.getTime() ?? a.createdAt.getTime();
      const bLastAdded =
        b.users[0]?.createdAt.getTime() ?? b.createdAt.getTime();

      return bLastAdded - aLastAdded;
    }

    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return {
    titles: sortedTitles,
    hasMore,
    nextPage: hasMore ? safePage + 1 : null,
  };
}
