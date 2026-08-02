"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";

export async function getTitleBySlug(slug: string) {
  const { session } = await requireUserServer();

  return prisma.title
    .findUnique({
      where: {
        slug,
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
            updatedAt: true,
            user: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    })
    .then((title) => {
      if (!title) return null;

      const currentUserTitle =
        title.users.find((entry) => entry.userId === session.userId) ?? null;

      const ratings = title.users
        .map((entry) => entry.rating)
        .filter((rating): rating is number => rating !== null);

      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null;

      return {
        ...title,
        currentUserTitle,
        stats: {
          libraryCount: title.users.length,
          ratingCount: ratings.length,
          averageRating,
          reviewCount: title.users.filter((entry) => entry.note).length,
        },
      };
    });
}
