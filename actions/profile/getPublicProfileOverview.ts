"use server";

import { prisma } from "@/lib/prisma";

export async function getPublicProfileOverview(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      role: true,
      avatarUrl: true,
      avatarPublicId: true,
      bannerUrl: true,
      bannerPublicId: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const [library, submissions, activityEvents, posts, lists] =
    await Promise.all([
      prisma.userTitle.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          rating: true,
          note: true,
          createdAt: true,
          updatedAt: true,
          title: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              year: true,
              imageUrl: true,
            },
          },
        },
      }),

      prisma.titleSubmission.findMany({
        where: { submittedById: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          createdAt: true,
        },
      }),

      prisma.activityEvent.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          type: true,
          rating: true,
          note: true,
          createdAt: true,
          title: {
            select: {
              name: true,
              slug: true,
              type: true,
              year: true,
            },
          },
          submission: {
            select: {
              name: true,
              status: true,
            },
          },
        },
      }),

      prisma.profilePost.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
          media: {
            select: {
              id: true,
              type: true,
              url: true,
              width: true,
              height: true,
            },
          },
          attachedUserTitle: {
            select: {
              id: true,
              rating: true,
              note: true,
              title: {
                select: {
                  name: true,
                  slug: true,
                  imageUrl: true,
                  type: true,
                  year: true,
                },
              },
            },
          },
          likes: {
            select: {
              id: true,
              userId: true,
            },
          },
          comments: {
            where: {
              parentId: null,
            },
            orderBy: [{ likes: { _count: "desc" } }, { createdAt: "asc" }],
            take: 20,
            select: {
              id: true,
              content: true,
              createdAt: true,
              author: {
                select: {
                  username: true,
                  avatarUrl: true,
                },
              },
              likes: {
                select: {
                  id: true,
                  userId: true,
                },
              },
              replies: {
                orderBy: [{ likes: { _count: "desc" } }, { createdAt: "asc" }],
                take: 20,
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  author: {
                    select: {
                      username: true,
                      avatarUrl: true,
                    },
                  },
                  likes: {
                    select: {
                      id: true,
                      userId: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.titleList.findMany({
        where: {
          visibility: "PUBLIC",
          systemType: null,
          OR: [{ userId: user.id }, { savedBy: { some: { userId: user.id } } }],
        },
        select: {
          id: true,
          userId: true,
          title: true,
          slug: true,
          createdAt: true,
          user: { select: { username: true } },
          items: {
            select: {
              id: true,
              createdAt: true,
              titleId: true,
              title: { select: { name: true, slug: true } },
            },
          },
        },
      }),
    ]);

  const ratings = library
    .map((entry) => entry.rating)
    .filter((rating): rating is number => rating !== null);

  const reviews = library.filter((entry) => entry.note);

  const recentActivityGroups = activityEvents.reduce<
    {
      key: string;
      title: string;
      href: string;
      createdAt: Date;
      events: typeof activityEvents;
    }[]
  >((groups, event) => {
    const key = event.title
      ? `title:${event.title.slug}`
      : event.submission
        ? `submission:${event.submission.name}`
        : `event:${event.id}`;

    const lastGroup = groups.at(-1);

    if (lastGroup?.key === key) {
      lastGroup.events.push(event);
      return groups;
    }

    groups.push({
      key,
      title: event.title?.name ?? event.submission?.name ?? "Unknown title",
      href: event.title
        ? `/titles/${event.title.slug}`
        : `/users/${user.username}`,
      createdAt: event.createdAt,
      events: [event],
    });

    return groups;
  }, []);

  const libraryTitleIds = new Set(library.map((entry) => entry.title.id));

  const createdListsCount = lists.filter(
    (list) => list.userId === user.id,
  ).length;

  const completedListsCount = lists.filter(
    (list) =>
      list.items.length > 0 &&
      list.items.every((item) => libraryTitleIds.has(item.titleId)),
  ).length;

  const recentListActivity = lists
    .filter((list) => list.userId === user.id)
    .flatMap((list) => {
      const listHref = `/lists/${list.user.username}/${list.slug}`;

      return [
        {
          id: `list:${list.id}`,
          kind: "created" as const,
          createdAt: list.createdAt,
          listTitle: list.title,
          listHref,
          titleName: null,
          titleHref: null,
        },
        ...list.items.map((item) => ({
          id: `item:${item.id}`,
          kind: "title-added" as const,
          createdAt: item.createdAt,
          listTitle: list.title,
          listHref,
          titleName: item.title.name,
          titleHref: `/titles/${item.title.slug}`,
        })),
      ];
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  return {
    user,
    stats: {
      libraryCount: library.length,
      ratingCount: ratings.length,
      reviewCount: reviews.length,
      averageRating:
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null,
      submissionsCount: submissions.length,
      completedListsCount,
      createdListsCount,
    },
    latestReviews: reviews.slice(0, 12),
    posts,
    recentActivityGroups,
    recentListActivity,
  };
}
