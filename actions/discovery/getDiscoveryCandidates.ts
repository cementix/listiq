"use server";

import { requireUserServer } from "@/lib/auth/guards";
import {
  TitleListSystemType,
  TitleType,
  DiscoveryAction,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { rankDiscoveryCandidates } from "@/lib/discovery/rankDiscoveryCandidates";

type Input = {
  type?: TitleType | null;
  excludeIds?: string[];
};

const candidateSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  imageUrl: true,
  backdropUrl: true,
  year: true,
  type: true,
  createdAt: true,
  genres: {
    select: { id: true, name: true, slug: true },
  },
  releaseDate: true,
  catalogScore: true,
} as const;

export async function getDiscoveryCandidates(input: Input = {}) {
  const { session } = await requireUserServer();

  if (input.type && !Object.values(TitleType).includes(input.type)) {
    throw new Error("Invalid title type");
  }

  const [library, saved, skipped] = await Promise.all([
    prisma.userTitle.findMany({
      where: { userId: session.userId },
      select: {
        titleId: true,
        rating: true,
        title: {
          select: {
            type: true,
            genres: { select: { id: true } },
          },
        },
      },
    }),
    prisma.titleListItem.findMany({
      where: {
        list: {
          userId: session.userId,
          systemType: TitleListSystemType.SAVE_FOR_LATER,
        },
      },
      select: {
        titleId: true,
        title: {
          select: {
            type: true,
            genres: { select: { id: true } },
          },
        },
      },
    }),
    prisma.userTitleDiscovery.findMany({
      where: {
        userId: session.userId,
        lastAction: DiscoveryAction.SKIPPED,
      },
      orderBy: { lastActionAt: "desc" },
      take: 100,
      select: {
        skipCount: true,
        title: {
          select: {
            type: true,
            genres: { select: { id: true } },
          },
        },
      },
    }),
  ]);

  const excluded = [
    ...new Set([
      ...library.map((item) => item.titleId),
      ...saved.map((item) => item.titleId),
      ...(input.excludeIds ?? []).slice(0, 100),
    ]),
  ];

  const where: Prisma.TitleWhereInput = {
    catalogEligible: true,
    catalogScore: { gte: 60 },
    imageUrl: { not: null },
    id: { notIn: excluded },
    ...(input.type ? { type: input.type } : {}),
  };

  const favoriteGenreIds = [
    ...new Set([
      ...library
        .filter((item) => item.rating !== null && item.rating >= 7)
        .flatMap((item) => item.title.genres.map((genre) => genre.id)),
      ...saved.flatMap((item) => item.title.genres.map((genre) => genre.id)),
    ]),
  ];

  const count = await prisma.title.count({ where });
  const randomSkip = Math.floor(Math.random() * Math.max(count - 100, 1));

  const [popular, random, matching] = await Promise.all([
    prisma.title.findMany({
      where,
      orderBy: [{ catalogScore: "desc" }, { id: "asc" }],
      take: 120,
      select: candidateSelect,
    }),
    prisma.title.findMany({
      where,
      orderBy: { id: "asc" },
      skip: randomSkip,
      take: 100,
      select: candidateSelect,
    }),
    favoriteGenreIds.length
      ? prisma.title.findMany({
          where: {
            ...where,
            genres: { some: { id: { in: favoriteGenreIds } } },
          },
          orderBy: [{ catalogScore: "desc" }, { id: "asc" }],
          take: 180,
          select: candidateSelect,
        })
      : Promise.resolve([]),
  ]);

  const candidates = [
    ...new Map(
      [...popular, ...random, ...matching].map((title) => [title.id, title]),
    ).values(),
  ];

  const history = await prisma.userTitleDiscovery.findMany({
    where: {
      userId: session.userId,
      titleId: { in: candidates.map((title) => title.id) },
    },
    select: {
      titleId: true,
      shownCount: true,
      skipCount: true,
      lastShownAt: true,
      lastAction: true,
      lastActionAt: true,
    },
  });

  return rankDiscoveryCandidates({
    candidates,
    library,
    saved,
    skipped,
    history,
  });
}
