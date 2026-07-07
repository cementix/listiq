"use server";

import { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type GetTitlesInput = {
  query?: string;
  type?: TitleType | "ALL";
};

export async function getTitles({ query = "", type = "ALL" }: GetTitlesInput) {
  const normalizedQuery = query.trim();

  return prisma.title.findMany({
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
          userId: true,
        },
      },
    },
  });
}
