"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";

export async function getProfileOverview() {
  const { session } = await requireUserServer();

  const [user, library, submissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
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
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  const ratings = library
    .map((entry) => entry.rating)
    .filter((rating): rating is number => rating !== null);

  const reviews = library.filter((entry) => entry.note);

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
    latestReviews: reviews.slice(0, 5),
    recentSubmissions: submissions.slice(0, 5),
  };
}
