import "server-only";

import { requireUserServer } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { ensureSaveForLaterList } from "./ensureSaveForLaterList";

export async function getMyTitleLists() {
  const { session } = await requireUserServer();
  await ensureSaveForLaterList(session.userId);

  const lists = await prisma.titleList.findMany({
    where: {
      OR: [
        { userId: session.userId },
        {
          visibility: "PUBLIC",
          savedBy: { some: { userId: session.userId } },
        },
      ],
    },
    select: {
      id: true,
      userId: true,
      title: true,
      slug: true,
      description: true,
      visibility: true,
      systemType: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { username: true, avatarUrl: true },
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
    orderBy: [
      { systemType: { sort: "asc", nulls: "last" } },
      { updatedAt: "desc" },
    ],
  });

  return lists.map((list) => {
    const completedCount = list.items.filter(
      (item) => item.title.users.length > 0,
    ).length;

    const ratings = list.items
      .map((item) => item.title.users[0]?.rating)
      .filter((rating): rating is number => typeof rating === "number");

    return {
      ...list,
      items: list.items.slice(0, 4),
      isSaved: list.userId !== session.userId,
      viewer: {
        completedCount,
        totalCount: list.items.length,
        completionPercentage: list.items.length
          ? Math.round((completedCount / list.items.length) * 100)
          : 0,
        averageRating: ratings.length
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null,
      },
    };
  });
}
