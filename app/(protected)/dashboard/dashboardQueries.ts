import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DashboardRailItem } from "./dashboardTypes";
import { shuffle } from "./dashboardUtils";
import { sourceLinkSelect } from "@/lib/catalog/attribution";

const dashboardTitleInclude = {
  externalTitles: { select: sourceLinkSelect },
  genres: {
    select: { id: true, name: true, slug: true },
    take: 4,
  },
  users: {
    select: {
      rating: true,
      note: true,
      user: {
        select: {
          libraryPublic: true,
          reviewsPublic: true,
        },
      },
    },
  },
} as const;

const catalogWhere: Prisma.TitleWhereInput = {
  catalogEligible: true,
  catalogScore: { gte: 60 },
  imageUrl: { not: null },
};

const popularOrder = [
  { catalogScore: "desc" as const },
  { id: "asc" as const },
];

export async function getDashboardTitles() {
  const now = new Date();
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2);

  const [topTitles, newReleases, games, anime, manga] = await Promise.all([
    prisma.title.findMany({
      where: catalogWhere,
      orderBy: popularOrder,
      take: 80,
      include: dashboardTitleInclude,
    }),
    prisma.title.findMany({
      where: {
        ...catalogWhere,
        releaseDate: { gte: twoYearsAgo, lte: now },
      },
      orderBy: [{ releaseDate: "desc" }, { catalogScore: "desc" }],
      take: 18,
      include: dashboardTitleInclude,
    }),
    prisma.title.findMany({
      where: { ...catalogWhere, type: "GAME" },
      orderBy: popularOrder,
      take: 18,
      include: dashboardTitleInclude,
    }),
    prisma.title.findMany({
      where: { ...catalogWhere, type: "ANIME" },
      orderBy: popularOrder,
      take: 18,
      include: dashboardTitleInclude,
    }),
    prisma.title.findMany({
      where: {
        ...catalogWhere,
        type: { in: ["MANGA", "MANHWA", "NOVEL"] },
      },
      orderBy: popularOrder,
      take: 18,
      include: dashboardTitleInclude,
    }),
  ]);

  const popularTitles = topTitles.slice(0, 18);

  const heroCandidates = topTitles
    .slice(0, 30)
    .filter(
      (title) =>
        title.backdropUrl &&
        title.description &&
        title.type !== "BOOK" &&
        title.type !== "OTHER",
    );

  const hero = shuffle(heroCandidates)[0] ?? topTitles[0] ?? null;

  const usedTypes = new Set<string>();
  const randomSideTitles = shuffle(
    topTitles.filter((title) => title.id !== hero?.id),
  )
    .filter((title) => {
      if (usedTypes.has(title.type)) return false;
      usedTypes.add(title.type);
      return true;
    })
    .slice(0, 4);

  const defaultRails: DashboardRailItem[] = [
    {
      title: "Popular now",
      href: "/titles?sort=popular",
      icon: "flame",
      titles: popularTitles,
    },
    {
      title: "New releases",
      href: "/titles?sort=newest",
      icon: "calendar",
      titles: newReleases,
    },
  ];

  const optionalRails: DashboardRailItem[] = [
    {
      title: "Games",
      href: "/titles?type=GAME&sort=popular",
      icon: "dice",
      titles: games,
    },
    {
      title: "Anime",
      href: "/titles?type=ANIME&sort=popular",
      icon: "star",
      titles: anime,
    },
    {
      title: "Manga, manhwa & novels",
      href: "/titles?type=MANGA&sort=popular",
      icon: "star",
      titles: manga,
    },
  ];

  return {
    hero,
    randomSideTitles,
    rails: [...defaultRails, ...shuffle(optionalRails).slice(0, 3)].filter(
      (rail) => rail.titles.length > 0,
    ),
  };
}
