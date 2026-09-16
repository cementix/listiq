import { prisma } from "@/lib/prisma";

import type { DashboardRailItem } from "./dashboardTypes";
import { getTitleStats, pickRandomFromTop, shuffle } from "./dashboardUtils";

// obj for prisma include for titles
const dashboardTitleInclude = {
  genres: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
    take: 4,
  },
  users: {
    select: {
      rating: true,
      note: true,
    },
  },
};

// helper for random titles
async function getRandomTitleIds(limit = 80) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "Title"
    WHERE "imageUrl" IS NOT NULL
    ORDER BY random()
    LIMIT ${limit}
  `;

  return rows.map((row) => row.id);
}

function pickDiverseHero<T extends { type: string }>(titles: T[]) {
  const groups = titles.reduce(
    (acc, title) => {
      acc[title.type] = acc[title.type] ?? [];
      acc[title.type].push(title);
      return acc;
    },
    {} as Record<string, T[]>,
  );

  const groupsList = shuffle(Object.values(groups)).filter(
    (group) => group.length > 0,
  );

  const group = groupsList[0];

  if (!group) {
    return null;
  }

  return shuffle(group.slice(0, 30))[0] ?? null;
}

async function getRandomHeroTitleIds(limit = 200) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "Title"
    WHERE "imageUrl" IS NOT NULL
      AND "description" IS NOT NULL
      AND "type" NOT IN ('BOOK', 'OTHER')
    ORDER BY random()
    LIMIT ${limit}
  `;

  return rows.map((row) => row.id);
}

// util to get all kinds of titles
export async function getDashboardTitles() {
  const [randomTitleIds, randomHeroTitleIds] = await Promise.all([
    getRandomTitleIds(80),
    getRandomHeroTitleIds(200),
  ]);
  // Promise.all for prisma queries
  const [
    heroCandidates,
    randomTitles,
    popularTitles,
    newReleases,
    games,
    anime,
    manga,
    books,
    topRatedPool,
  ] = await Promise.all([
    prisma.title.findMany({
      where: {
        id: { in: randomHeroTitleIds },
      },
      include: dashboardTitleInclude,
    }),
    prisma.title.findMany({
      where: {
        id: { in: randomTitleIds },
      },
      include: dashboardTitleInclude,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: { not: "BOOK" },
      },
      include: dashboardTitleInclude,
      orderBy: [{ users: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        releaseDate: { not: null },
        year: { gte: 1980 },
      },
      include: dashboardTitleInclude,
      orderBy: [{ releaseDate: "desc" }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: "GAME",
      },
      include: dashboardTitleInclude,
      orderBy: [{ users: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: "ANIME",
      },
      include: dashboardTitleInclude,
      orderBy: [{ users: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: { in: ["MANGA", "MANHWA", "NOVEL"] },
      },
      include: dashboardTitleInclude,
      orderBy: [{ users: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: "BOOK",
        year: { gte: 1980 },
      },
      include: dashboardTitleInclude,
      orderBy: [{ updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: { not: "BOOK" },
      },
      include: dashboardTitleInclude,
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  ]);

  // pick random hero
  const hero =
    pickDiverseHero(heroCandidates) ??
    pickDiverseHero(popularTitles) ??
    randomTitles[0] ??
    null;

  // pick random side titles
  const randomSideTitles = shuffle(
    Object.values(
      shuffle(randomTitles)
        .filter((title) => title.id !== hero?.id)
        .reduce(
          (groups, title) => {
            if (!groups[title.type]) {
              groups[title.type] = title;
            }

            return groups;
          },
          {} as Partial<
            Record<
              (typeof randomTitles)[number]["type"],
              (typeof randomTitles)[number]
            >
          >,
        ),
    ),
  ).slice(0, 4);

  // top rated titles for the rail
  const topRated = topRatedPool
    .map((title) => ({
      title,
      stats: getTitleStats(title),
    }))
    .filter((item) => item.stats.ratingCount >= 2)
    .sort((a, b) => {
      return (
        (b.stats.averageRating ?? 0) - (a.stats.averageRating ?? 0) ||
        b.stats.ratingCount - a.stats.ratingCount
      );
    })
    .slice(0, 18)
    .map((item) => item.title);

  // optional rails array (insta shuffle here to just slice after)
  const optionalRails: DashboardRailItem[] = shuffle([
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
    {
      title: "Books",
      href: "/titles?type=BOOK&sort=newest",
      icon: "star",
      titles: books,
    },
    {
      title: "Top rated",
      href: "/titles?sort=highest-rated",
      icon: "star",
      titles: topRated,
    },
  ]);

  // first 2 default rails
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

  // get other random rails
  const rails = [...defaultRails, ...optionalRails.slice(0, 3)].filter(
    (rail) => rail.titles.length > 0,
  );

  // return queried titles
  return {
    hero,
    randomSideTitles,
    rails,
  };
}
