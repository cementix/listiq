"use server";

import { prisma } from "@/lib/prisma";
import { getPublicTitleStats } from "@/lib/title/getPublicTitleStats";
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
                libraryPublic: true,
                reviewsPublic: true,
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

      const { users, ...publicTitle } = title;
      const ownEntry = users.find((entry) => entry.userId === session.userId);
      const currentUserTitle = ownEntry
        ? { id: ownEntry.id, rating: ownEntry.rating, note: ownEntry.note }
        : null;
      const visibleReviews = users
        .filter(
          (entry) =>
            entry.user.reviewsPublic || entry.userId === session.userId,
        )
        .map((entry) => ({
          id: entry.id,
          rating: entry.rating,
          note: entry.note,
          user: { username: entry.user.username },
        }));

      return {
        ...publicTitle,
        users: visibleReviews,
        currentUserTitle,
        stats: getPublicTitleStats(users),
      };
    });
}
