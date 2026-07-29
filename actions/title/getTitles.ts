"use server";

import { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";

type TitleSort = "newest" | "popular";

type GetTitlesInput = {
  query?: string;
  type?: TitleType | "ALL";
  sort?: TitleSort;
};

export async function getTitles({
  query = "",
  type = "ALL",
  sort = "newest",
}: GetTitlesInput) {
  const { session } = await requireUserServer();
  const normalizedQuery = query.trim();

  const orderBy =
    sort === "popular"
      ? {
          users: {
            _count: "desc" as const,
          },
        }
      : {
          createdAt: "desc" as const,
        };

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
    orderBy,
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
      },
    },
  });

  const titlesWithStats = titles.map((title) => {
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

  return titlesWithStats;
}
