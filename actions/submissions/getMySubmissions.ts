"use server";

import { prisma } from "@/lib/prisma";

import { requireUserServer } from "@/lib/auth/guards";

export async function getMySubmissions() {
  const { session } = await requireUserServer();

  return prisma.titleSubmission.findMany({
    where: {
      submittedById: session.userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      reviewedBy: {
        select: {
          id: true,
          username: true,
        },
      },
      genres: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}
