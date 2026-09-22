import "server-only";

import { requireUserServer } from "@/actions/auth";
import { TitleListVisibility } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function getTitleListPage(username: string, slug: string) {
  const { session } = await requireUserServer();

  const list = await prisma.titleList.findFirst({
    where: {
      slug,
      user: { username },
      OR: [
        { visibility: TitleListVisibility.PUBLIC },
        { userId: session.userId },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      visibility: true,
      systemType: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      items: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          position: true,
          createdAt: true,
          title: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              year: true,
              imageUrl: true,
              users: {
                where: { userId: session.userId },
                take: 1,
                select: {
                  id: true,
                  rating: true,
                  note: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!list) return null;

  const items = list.items.map((item) => {
    const { users, ...title } = item.title;

    return {
      ...item,
      title,
      currentUserTitle: users[0] ?? null,
    };
  });

  const completedCount = items.filter(
    (item) => item.currentUserTitle !== null,
  ).length;

  const ratings = items
    .map((item) => item.currentUserTitle?.rating)
    .filter((rating): rating is number => typeof rating === "number");

  return {
    ...list,
    user: {
      username: list.user.username,
      avatarUrl: list.user.avatarUrl,
    },
    items,
    viewer: {
      isOwner: list.user.id === session.userId,
      totalCount: items.length,
      completedCount,
      completionPercentage:
        items.length === 0
          ? 0
          : Math.round((completedCount / items.length) * 100),
      ratedCount: ratings.length,
      averageRating:
        ratings.length === 0
          ? null
          : ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
    },
  };
}
