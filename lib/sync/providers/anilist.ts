import { generateUniqueSlug } from "@/actions/title/generateUniqueSlug";
import { slugify } from "@/actions/title/slugify";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { setSyncProgress } from "@/lib/sync/syncUtils";

const ANILIST_API_URL = "https://graphql.anilist.co";
const ANILIST_REQUEST_DELAY_MS = 800;
const ANILIST_PER_PAGE = 50;
const ANILIST_MAX_PAGE_DEPTH = 5000;
const ANILIST_MAX_PAGES = Math.floor(ANILIST_MAX_PAGE_DEPTH / ANILIST_PER_PAGE);

type AniListMediaType = "ANIME" | "MANGA";
type AniListMediaFormat =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "SPECIAL"
  | "OVA"
  | "ONA"
  | "MUSIC"
  | "MANGA"
  | "NOVEL"
  | "ONE_SHOT";
type AniListCountry = "JP" | "KR" | "CN" | "TW";
type AniListSort =
  | "POPULARITY_DESC"
  | "SCORE_DESC"
  | "TRENDING_DESC"
  | "FAVOURITES_DESC";

type AniListMedia = {
  id: number;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  coverImage: {
    extraLarge: string | null;
    large: string | null;
  };
  bannerImage: string | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  isAdult: boolean;
  countryOfOrigin: string | null;
  format: AniListMediaFormat | null;
};

type AniListPageResponse = {
  data: {
    Page: {
      pageInfo: {
        hasNextPage: boolean;
      };
      media: AniListMedia[];
    };
  };
  errors?: {
    message: string;
  }[];
};

type MappedAniListTitle = {
  externalId: string;
  name: string;
  description: string | null;
  releaseDate: Date | null;
  year: number | null;
  imageUrl: string | null;
  backdropUrl: string | null;
  isAdult: boolean;
  popularity: number;
  averageScore: number;
  rawData: Prisma.InputJsonValue;
  genres: {
    name: string;
    slug: string;
  }[];
};

type SyncResult = {
  titlesCreated: number;
  titlesUpdated: number;
};

type SyncAniListOptions = {
  pages?: number;
  minPopularity?: number;
  minAverageScore?: number;
};

const MEDIA_QUERY = `
  query MediaPage(
    $page: Int!,
    $perPage: Int!,
    $type: MediaType!,
    $format: [MediaFormat],
    $countryOfOrigin: CountryCode,
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media(
        type: $type,
        format_in: $format,
        countryOfOrigin: $countryOfOrigin,
        isAdult: false,
        sort: $sort
      ) {
        id
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        startDate {
          year
          month
          day
        }
        coverImage {
          extraLarge
          large
        }
        bannerImage
        genres
        averageScore
        popularity
        isAdult
        countryOfOrigin
        format
      }
    }
  }
`;

async function fetchAniListPage(params: {
  page: number;
  type: AniListMediaType;
  format?: AniListMediaFormat[];
  countryOfOrigin?: AniListCountry;
  sort: AniListSort[];
}, attempt = 0) {
  const response = await fetch(ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: MEDIA_QUERY,
      variables: {
        page: params.page,
        perPage: ANILIST_PER_PAGE,
        type: params.type,
        format: params.format,
        countryOfOrigin: params.countryOfOrigin,
        sort: params.sort,
      },
    }),
  });

  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** attempt, 60_000);

    await sleep(waitMs);

    return fetchAniListPage(params, attempt + 1);
  }

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`AniList request failed ${response.status}: ${body}`);
  }

  const data = (await response.json()) as AniListPageResponse;

  if (data.errors?.length) {
    throw new Error(`AniList request failed: ${data.errors[0].message}`);
  }

  return data.data.Page;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAniListTitleName(media: AniListMedia) {
  return media.title.english || media.title.romaji || media.title.native;
}

function getAniListReleaseDate(media: AniListMedia) {
  const { year, month, day } = media.startDate;

  if (!year) {
    return null;
  }

  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

function mapAniListMedia(media: AniListMedia): MappedAniListTitle | null {
  const name = getAniListTitleName(media);

  if (!name) {
    return null;
  }

  return {
    externalId: String(media.id),
    name,
    description: media.description,
    releaseDate: getAniListReleaseDate(media),
    year: media.startDate.year,
    imageUrl: media.coverImage.extraLarge || media.coverImage.large,
    backdropUrl: media.bannerImage,
    isAdult: media.isAdult,
    popularity: media.popularity ?? 0,
    averageScore: media.averageScore ?? 0,
    rawData: media as Prisma.InputJsonValue,
    genres: media.genres.map((genre) => ({
      name: genre,
      slug: slugify(genre),
    })),
  };
}

async function upsertAniListTitle({
  title,
  type,
  externalUrl,
}: {
  title: MappedAniListTitle;
  type: "ANIME" | "MANGA" | "MANHWA" | "NOVEL";
  externalUrl: string;
}) {
  if (title.isAdult || !title.imageUrl || !slugify(title.name)) {
    return "skipped" as const;
  }

  for (const genre of title.genres) {
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
        provider: "ANILIST",
        externalId: title.externalId,
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
        name: title.name,
        year: title.year,
        description: title.description,
        imageUrl: title.imageUrl,
        backdropUrl: title.backdropUrl,
        releaseDate: title.releaseDate,
        genres: {
          set: title.genres.map((genre) => ({
            slug: genre.slug,
          })),
        },
      },
    });

    await prisma.externalTitle.update({
      where: {
        provider_externalId: {
          provider: "ANILIST",
          externalId: title.externalId,
        },
      },
      data: {
        externalUrl,
        rawData: title.rawData,
        lastSyncedAt: new Date(),
      },
    });

    return "updated" as const;
  }

  const baseSlug = slugify(title.name);
  const existingTitle = await prisma.title.findFirst({
    where: {
      type,
      OR: [
        { slug: baseSlug },
        { name: { equals: title.name, mode: "insensitive" } },
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
        provider: "ANILIST",
        externalId: title.externalId,
        externalUrl,
        rawData: title.rawData,
        lastSyncedAt: new Date(),
      },
    });

    return "updated" as const;
  }

  const slug = await generateUniqueSlug(title.name);

  await prisma.title.create({
    data: {
      name: title.name,
      slug,
      type,
      year: title.year,
      description: title.description,
      imageUrl: title.imageUrl,
      backdropUrl: title.backdropUrl,
      releaseDate: title.releaseDate,
      externalTitles: {
        create: {
          provider: "ANILIST",
          externalId: title.externalId,
          externalUrl,
          rawData: title.rawData,
          lastSyncedAt: new Date(),
        },
      },
      genres: {
        connect: title.genres.map((genre) => ({
          slug: genre.slug,
        })),
      },
    },
  });

  return "created" as const;
}

async function syncAniListMedia(params: {
  type: AniListMediaType;
  titleType: "ANIME" | "MANGA" | "MANHWA" | "NOVEL";
  format?: AniListMediaFormat[];
  countryOfOrigin?: AniListCountry;
  sort: AniListSort[];
  options?: SyncAniListOptions;
}) {
  const pages = params.options?.pages ?? 20;
  const safePages = Math.min(pages, ANILIST_MAX_PAGES);
  const minPopularity = params.options?.minPopularity ?? 0;
  const minAverageScore = params.options?.minAverageScore ?? 0;

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = 1; page <= safePages; page++) {
    setSyncProgress(
      "anilist",
      `${params.titleType} page ${page}/${safePages}`,
      {
        titlesCreated,
        titlesUpdated,
      },
    );

    const data = await fetchAniListPage({
      page,
      type: params.type,
      format: params.format,
      countryOfOrigin: params.countryOfOrigin,
      sort: params.sort,
    });

    for (const media of data.media) {
      const title = mapAniListMedia(media);

      if (
        !title ||
        title.popularity < minPopularity ||
        title.averageScore < minAverageScore
      ) {
        continue;
      }

      const result = await upsertAniListTitle({
        title,
        type: params.titleType,
        externalUrl: `https://anilist.co/${params.type.toLowerCase()}/${title.externalId}`,
      });

      if (result === "created") {
        titlesCreated += 1;
      }

      if (result === "updated") {
        titlesUpdated += 1;
      }
    }

    if (!data.pageInfo.hasNextPage) {
      break;
    }

    await sleep(ANILIST_REQUEST_DELAY_MS);
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

export async function syncAniListDailyCatalog(): Promise<SyncResult> {
  const anime = await syncAniListMedia({
    type: "ANIME",
    titleType: "ANIME",
    format: ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"],
    sort: ["POPULARITY_DESC", "SCORE_DESC"],
    options: {
      pages: 8,
      minPopularity: 500,
    },
  });

  const manga = await syncAniListMedia({
    type: "MANGA",
    titleType: "MANGA",
    format: ["MANGA", "ONE_SHOT"],
    countryOfOrigin: "JP",
    sort: ["POPULARITY_DESC", "SCORE_DESC"],
    options: {
      pages: 6,
      minPopularity: 200,
    },
  });

  const manhwa = await syncAniListMedia({
    type: "MANGA",
    titleType: "MANHWA",
    format: ["MANGA"],
    countryOfOrigin: "KR",
    sort: ["POPULARITY_DESC", "SCORE_DESC"],
    options: {
      pages: 4,
      minPopularity: 100,
    },
  });

  const novels = await syncAniListMedia({
    type: "MANGA",
    titleType: "NOVEL",
    format: ["NOVEL"],
    sort: ["POPULARITY_DESC", "SCORE_DESC"],
    options: {
      pages: 4,
      minPopularity: 100,
    },
  });

  return {
    titlesCreated:
      anime.titlesCreated +
      manga.titlesCreated +
      manhwa.titlesCreated +
      novels.titlesCreated,
    titlesUpdated:
      anime.titlesUpdated +
      manga.titlesUpdated +
      manhwa.titlesUpdated +
      novels.titlesUpdated,
  };
}

export async function syncAniListDeepCatalog(): Promise<SyncResult> {
  const anime = await syncAniListMedia({
    type: "ANIME",
    titleType: "ANIME",
    format: ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"],
    sort: ["POPULARITY_DESC", "SCORE_DESC"],
    options: {
      pages: 100,
      minPopularity: 200,
    },
  });

  const manga = await syncAniListMedia({
    type: "MANGA",
    titleType: "MANGA",
    format: ["MANGA", "ONE_SHOT"],
    countryOfOrigin: "JP",
    sort: ["POPULARITY_DESC", "SCORE_DESC"],
    options: {
      pages: 100,
      minPopularity: 75,
    },
  });

  const manhwa = await syncAniListMedia({
    type: "MANGA",
    titleType: "MANHWA",
    format: ["MANGA"],
    countryOfOrigin: "KR",
    sort: ["POPULARITY_DESC", "SCORE_DESC"],
    options: {
      pages: 80,
      minPopularity: 25,
    },
  });

  const novels = await syncAniListMedia({
    type: "MANGA",
    titleType: "NOVEL",
    format: ["NOVEL"],
    sort: ["POPULARITY_DESC", "SCORE_DESC"],
    options: {
      pages: 80,
      minPopularity: 25,
    },
  });

  return {
    titlesCreated:
      anime.titlesCreated +
      manga.titlesCreated +
      manhwa.titlesCreated +
      novels.titlesCreated,
    titlesUpdated:
      anime.titlesUpdated +
      manga.titlesUpdated +
      manhwa.titlesUpdated +
      novels.titlesUpdated,
  };
}
