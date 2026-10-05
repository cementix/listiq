import { generateUniqueSlug } from "@/actions/title/generateUniqueSlug";
import { slugify } from "@/actions/title/slugify";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { setSyncProgress } from "@/lib/sync/syncUtils";

const RAWG_API_BASE_URL = "https://api.rawg.io/api";

type RawgGame = {
  id: number;
  name: string;
  slug: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  ratings_count: number;
  metacritic: number | null;
  genres: {
    id: number;
    name: string;
    slug: string;
  }[];
};

type RawgResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function getRawgApiKey() {
  const apiKey = process.env.RAWG_API_KEY;

  if (!apiKey) {
    throw new Error("RAWG_API_KEY is not set");
  }

  return apiKey;
}

async function fetchRawg<T>(
  path: string,
  params: Record<string, string | number> = {},
  attempt = 0,
) {
  const searchParams = new URLSearchParams({
    key: getRawgApiKey(),
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
  });

  const response = await fetch(
    `${RAWG_API_BASE_URL}${path}?${searchParams.toString()}`,
  );

  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** attempt, 60_000);

    await new Promise((resolve) => setTimeout(resolve, waitMs));

    return fetchRawg<T>(path, params, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`RAWG request failed ${response.status} ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchRawgGamesFromPath(
  params: {
    page?: number;
    pageSize?: number;
    ordering?: string;
    dates?: string;
    metacritic?: string;
  } = {},
) {
  const data = await fetchRawg<RawgResponse<RawgGame>>("/games", {
    page: params.page ?? 1,
    page_size: params.pageSize ?? 40,
    ordering: params.ordering ?? "-added",
    ...(params.dates ? { dates: params.dates } : {}),
    ...(params.metacritic ? { metacritic: params.metacritic } : {}),
  });

  return data.results.map((game) => ({
    externalId: String(game.id),
    name: game.name,
    description: null,
    releaseDate: game.released ? new Date(game.released) : null,
    year: game.released ? new Date(game.released).getUTCFullYear() : null,
    imageUrl: game.background_image,
    backdropUrl: game.background_image,
    rating: game.rating,
    ratingCount: game.ratings_count,
    metacritic: game.metacritic,
    slug: game.slug,
    rawData: game as Prisma.InputJsonValue,
    genres: game.genres.map((genre) => ({
      name: genre.name,
      slug: genre.slug,
    })),
  }));
}

type MappedRawgGame = Awaited<
  ReturnType<typeof fetchRawgGamesFromPath>
>[number];

type SyncResult = {
  titlesCreated: number;
  titlesUpdated: number;
};

async function upsertRawgGame(game: MappedRawgGame) {
  if (!game.imageUrl || !slugify(game.name)) {
    return "skipped" as const;
  }

  for (const genre of game.genres) {
    await prisma.genre.upsert({
      where: {
        slug: genre.slug,
      },
      update: {
        name: genre.name,
      },
      create: {
        name: genre.name,
        slug: genre.slug,
      },
    });
  }

  const existingExternalTitle = await prisma.externalTitle.findUnique({
    where: {
      provider_externalId: {
        provider: "RAWG",
        externalId: game.externalId,
      },
    },
    select: {
      titleId: true,
    },
  });

  if (existingExternalTitle) {
    await prisma.title.update({
      where: {
        id: existingExternalTitle.titleId,
      },
      data: {
        name: game.name,
        year: game.year,
        description: game.description,
        imageUrl: game.imageUrl,
        backdropUrl: game.backdropUrl,
        releaseDate: game.releaseDate,
        genres: {
          set: game.genres.map((genre) => ({
            slug: genre.slug,
          })),
        },
      },
    });

    await prisma.externalTitle.update({
      where: {
        provider_externalId: {
          provider: "RAWG",
          externalId: game.externalId,
        },
      },
      data: {
        externalUrl: `https://rawg.io/games/${game.slug}`,
        rawData: game.rawData,
        lastSyncedAt: new Date(),
      },
    });

    return "updated" as const;
  }

  const baseSlug = slugify(game.name);

  const existingTitle = await prisma.title.findFirst({
    where: {
      type: "GAME",
      OR: [
        { slug: baseSlug },
        { name: { equals: game.name, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
    },
  });

  if (existingTitle) {
    await prisma.externalTitle.create({
      data: {
        titleId: existingTitle.id,
        provider: "RAWG",
        externalId: game.externalId,
        externalUrl: `https://rawg.io/games/${game.slug}`,
        rawData: game.rawData,
        lastSyncedAt: new Date(),
      },
    });

    return "updated" as const;
  }

  const slug = await generateUniqueSlug(game.name);

  await prisma.title.create({
    data: {
      name: game.name,
      slug,
      type: "GAME",
      year: game.year,
      description: game.description,
      imageUrl: game.imageUrl,
      backdropUrl: game.backdropUrl,
      releaseDate: game.releaseDate,
      externalTitles: {
        create: {
          provider: "RAWG",
          externalId: game.externalId,
          externalUrl: `https://rawg.io/games/${game.slug}`,
          rawData: game.rawData,
          lastSyncedAt: new Date(),
        },
      },
      genres: {
        connect: game.genres.map((genre) => ({
          slug: genre.slug,
        })),
      },
    },
  });

  return "created" as const;
}

async function syncRawgGamesFromParams(
  params: {
    ordering?: string;
    dates?: string;
    metacritic?: string;
  },
  options?: { pages?: number; minRatingCount: number },
): Promise<SyncResult> {
  const pages = options?.pages ?? 5;
  const minRatingCount = options?.minRatingCount ?? 0;

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = 1; page <= pages; page++) {
    setSyncProgress(
      "rawg",
      `${params.ordering ?? "-added"} page ${page}/${pages}`,
      {
        titlesCreated,
        titlesUpdated,
      },
    );

    let games: MappedRawgGame[];

    try {
      games = await fetchRawgGamesFromPath({
        ...params,
        page,
        pageSize: 40,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("RAWG request failed 404")
      ) {
        break;
      }

      throw error;
    }

    if (games.length === 0) {
      break;
    }

    for (const game of games) {
      if (game.ratingCount < minRatingCount) {
        continue;
      }

      const result = await upsertRawgGame(game);

      if (result === "created") {
        titlesCreated += 1;
      }

      if (result === "updated") {
        titlesUpdated += 1;
      }
    }
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

export async function syncRawgDailyCatalog(): Promise<SyncResult> {
  const popular = await syncRawgGamesFromParams(
    { ordering: "-added" },
    { pages: 10, minRatingCount: 100 },
  );

  const topRated = await syncRawgGamesFromParams(
    { ordering: "-rating" },
    { pages: 10, minRatingCount: 200 },
  );

  const metacritic = await syncRawgGamesFromParams(
    { ordering: "-metacritic", metacritic: "75,100" },
    { pages: 10, minRatingCount: 50 },
  );

  return {
    titlesCreated:
      popular.titlesCreated + topRated.titlesCreated + metacritic.titlesCreated,
    titlesUpdated:
      popular.titlesUpdated + topRated.titlesUpdated + metacritic.titlesUpdated,
  };
}

export async function syncRawgDeepCatalog(): Promise<SyncResult> {
  const popular = await syncRawgGamesFromParams(
    { ordering: "-added" },
    { pages: 250, minRatingCount: 50 },
  );

  const topRated = await syncRawgGamesFromParams(
    { ordering: "-rating" },
    { pages: 200, minRatingCount: 100 },
  );

  const metacritic = await syncRawgGamesFromParams(
    { ordering: "-metacritic", metacritic: "70,100" },
    { pages: 200, minRatingCount: 30 },
  );

  return {
    titlesCreated:
      popular.titlesCreated + topRated.titlesCreated + metacritic.titlesCreated,
    titlesUpdated:
      popular.titlesUpdated + topRated.titlesUpdated + metacritic.titlesUpdated,
  };
}

export async function syncRawgSeedCatalog(): Promise<SyncResult> {
  const popular = await syncRawgGamesFromParams(
    { ordering: "-added" },
    { pages: 15, minRatingCount: 200 },
  );

  const rated = await syncRawgGamesFromParams(
    { ordering: "-rating" },
    { pages: 10, minRatingCount: 300 },
  );

  const acclaimed = await syncRawgGamesFromParams(
    { ordering: "-metacritic", metacritic: "80,100" },
    { pages: 8, minRatingCount: 150 },
  );

  return {
    titlesCreated:
      popular.titlesCreated + rated.titlesCreated + acclaimed.titlesCreated,
    titlesUpdated:
      popular.titlesUpdated + rated.titlesUpdated + acclaimed.titlesUpdated,
  };
}
