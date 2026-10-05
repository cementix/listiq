"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";

export async function getProfileOverview() {
  const { session } = await requireUserServer();

  const [user, library, submissions, activityEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        avatarPublicId: true,
        bannerUrl: true,
        bannerPublicId: true,
        createdAt: true,
      },
    }),
    prisma.userTitle.findMany({
      where: { userId: session.userId },
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
      where: { submittedById: session.userId },
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
      where: { userId: session.userId },
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
  ]);

  if (!user) {
    throw new Error("User not found");
  }

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
      href: event.title ? `/titles/${event.title.slug}` : "/my-submissions",
      createdAt: event.createdAt,
      events: [event],
    });

    return groups;
  }, []);

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
    },
    recentLibrary: library.slice(0, 8),
    latestReviews: reviews.slice(0, 12),
    recentSubmissions: submissions.slice(0, 6),
    recentActivity: activityEvents,
    recentActivityGroups,
  };
}
