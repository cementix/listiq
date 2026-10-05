import { generateUniqueSlug } from "@/actions/title/generateUniqueSlug";
import { slugify } from "@/actions/title/slugify";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { upsertTitleAlias } from "@/lib/sync/titleAliases";
import {
  getRetryDelayMs,
  setSyncProgress,
  sleep,
  type SyncResult,
} from "@/lib/sync/syncUtils";

const COMIC_VINE_API_BASE_URL = "https://comicvine.gamespot.com/api";
const COMIC_VINE_PAGE_SIZE = 100;
const COMIC_VINE_REQUEST_DELAY_MS = 1100;

type ComicVineImage = {
  icon_url?: string | null;
  medium_url?: string | null;
  screen_url?: string | null;
  small_url?: string | null;
  super_url?: string | null;
  thumb_url?: string | null;
  tiny_url?: string | null;
  original_url?: string | null;
};

type ComicVinePublisher = {
  id: number;
  name: string;
} | null;

type ComicVineVolume = {
  id: number;
  name: string | null;
  count_of_issues: number | null;
  deck: string | null;
  description: string | null;
  start_year: string | null;
  date_added: string | null;
  date_last_updated: string | null;
  site_detail_url: string | null;
  publisher: ComicVinePublisher;
  image: ComicVineImage | null;
};

type ComicVineResponse<T> = {
  error: string;
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number;
  results: T[];
};

type MappedComicVineVolume = {
  externalId: string;
  name: string;
  description: string | null;
  releaseDate: Date | null;
  year: number | null;
  imageUrl: string | null;
  externalUrl: string | null;
  rawData: Prisma.InputJsonValue;
  aliases: {
    value: string;
    kind: "PRIMARY" | "SYNONYM";
  }[];
  genres: {
    name: string;
    slug: string;
  }[];
};

type SyncComicVineOptions = {
  pages?: number;
  sort?: string;
};

function getComicVineApiKey() {
  const apiKey = process.env.COMICVINE_API_KEY;

  if (!apiKey) {
    throw new Error("COMICVINE_API_KEY is not set");
  }

  return apiKey;
}

function getComicVineUserAgent() {
  return process.env.COMICVINE_USER_AGENT ?? "Listiq/0.1";
}

async function fetchComicVine<T>(
  path: string,
  params: Record<string, string | number> = {},
  attempt = 0,
): Promise<T> {
  const searchParams = new URLSearchParams({
    api_key: getComicVineApiKey(),
    format: "json",
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
  });

  const response = await fetch(
    `${COMIC_VINE_API_BASE_URL}${path}?${searchParams.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": getComicVineUserAgent(),
      },
    },
  );

  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    await sleep(getRetryDelayMs(response, attempt));

    return fetchComicVine<T>(path, params, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`Comic Vine request failed ${response.status} ${path}`);
  }

  return response.json() as Promise<T>;
}

function stripHtml(value?: string | null) {
  if (!value) {
    return null;
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getComicVineImageUrl(image: ComicVineImage | null) {
  return (
    image?.super_url ||
    image?.screen_url ||
    image?.medium_url ||
    image?.small_url ||
    image?.thumb_url ||
    null
  );
}

function parseStartYear(value: string | null) {
  if (!value) {
    return {
      releaseDate: null,
      year: null,
    };
  }

  const year = Number(value);

  if (!Number.isFinite(year)) {
    return {
      releaseDate: null,
      year: null,
    };
  }

  return {
    releaseDate: new Date(Date.UTC(year, 0, 1)),
    year,
  };
}

function mapComicVineVolume(
  volume: ComicVineVolume,
): MappedComicVineVolume | null {
  const name = volume.name?.trim();

  if (!name || !slugify(name)) {
    return null;
  }

  const { releaseDate, year } = parseStartYear(volume.start_year);
  const publisherName = volume.publisher?.name?.trim();

  return {
    externalId: String(volume.id),
    name,
    description: stripHtml(volume.deck) || stripHtml(volume.description),
    releaseDate,
    year,
    imageUrl: getComicVineImageUrl(volume.image),
    externalUrl: volume.site_detail_url,
    rawData: volume as Prisma.InputJsonValue,
    aliases: [{ value: name, kind: "PRIMARY" }],
    genres: publisherName
      ? [
          {
            name: publisherName,
            slug: slugify(publisherName),
          },
        ]
      : [],
  };
}

async function upsertComicVineVolume(volume: MappedComicVineVolume) {
  if (!volume.imageUrl) {
    return "skipped" as const;
  }

  for (const genre of volume.genres) {
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
        provider: "COMIC_VINE",
        externalId: volume.externalId,
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
        name: volume.name,
        year: volume.year,
        description: volume.description,
        imageUrl: volume.imageUrl,
        backdropUrl: volume.imageUrl,
        releaseDate: volume.releaseDate,
        genres: {
          set: volume.genres.map((genre) => ({
            slug: genre.slug,
          })),
        },
      },
    });

    await prisma.externalTitle.update({
      where: {
        provider_externalId: {
          provider: "COMIC_VINE",
          externalId: volume.externalId,
        },
      },
      data: {
        externalUrl: volume.externalUrl,
        rawData: volume.rawData,
        lastSyncedAt: new Date(),
      },
    });

    await upsertTitleAlias(
      existingExternalTitle.titleId,
      volume.aliases.map((alias) => ({
        ...alias,
        source: "COMIC_VINE",
      })),
    );

    return "updated" as const;
  }

  const baseSlug = slugify(volume.name);
  const existingTitle = await prisma.title.findFirst({
    where: {
      type: "COMIC",
      OR: [
        { slug: baseSlug },
        { name: { equals: volume.name, mode: "insensitive" } },
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
        provider: "COMIC_VINE",
        externalId: volume.externalId,
        externalUrl: volume.externalUrl,
        rawData: volume.rawData,
        lastSyncedAt: new Date(),
      },
    });

    await upsertTitleAlias(
      existingTitle.id,
      volume.aliases.map((alias) => ({
        ...alias,
        source: "COMIC_VINE",
      })),
    );

    return "updated" as const;
  }

  const title = await prisma.title.create({
    data: {
      name: volume.name,
      slug: await generateUniqueSlug(volume.name),
      type: "COMIC",
      year: volume.year,
      description: volume.description,
      imageUrl: volume.imageUrl,
      backdropUrl: volume.imageUrl,
      releaseDate: volume.releaseDate,
      externalTitles: {
        create: {
          provider: "COMIC_VINE",
          externalId: volume.externalId,
          externalUrl: volume.externalUrl,
          rawData: volume.rawData,
          lastSyncedAt: new Date(),
        },
      },
      genres: {
        connect: volume.genres.map((genre) => ({
          slug: genre.slug,
        })),
      },
    },
    select: {
      id: true,
    },
  });

  await upsertTitleAlias(
    title.id,
    volume.aliases.map((alias) => ({
      ...alias,
      source: "COMIC_VINE",
    })),
  );

  return "created" as const;
}

export async function syncComicVineVolumes(
  options?: SyncComicVineOptions,
): Promise<SyncResult> {
  const pages = options?.pages ?? 5;
  const sort = options?.sort ?? "date_last_updated:desc";

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = 0; page < pages; page++) {
    setSyncProgress("comic-vine", `${sort} page ${page + 1}/${pages}`, {
      titlesCreated,
      titlesUpdated,
    });

    const data = await fetchComicVine<ComicVineResponse<ComicVineVolume>>(
      "/volumes/",
      {
        limit: COMIC_VINE_PAGE_SIZE,
        offset: page * COMIC_VINE_PAGE_SIZE,
        sort,
        field_list:
          "id,name,count_of_issues,deck,description,start_year,date_added,date_last_updated,site_detail_url,publisher,image",
      },
    );

    if (data.status_code !== 1) {
      throw new Error(`Comic Vine API error ${data.status_code}: ${data.error}`);
    }

    const volumes = data.results.flatMap((item) => {
      const volume = mapComicVineVolume(item);

      return volume ? [volume] : [];
    });

    if (volumes.length === 0) {
      break;
    }

    for (const volume of volumes) {
      const result = await upsertComicVineVolume(volume);

      if (result === "created") {
        titlesCreated += 1;
      }

      if (result === "updated") {
        titlesUpdated += 1;
      }
    }

    if (data.offset + data.number_of_page_results >= data.number_of_total_results) {
      break;
    }

    await sleep(COMIC_VINE_REQUEST_DELAY_MS);
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

export async function syncComicVineDailyCatalog() {
  return syncComicVineVolumes({
    pages: 10,
    sort: "date_last_updated:desc",
  });
}

export async function syncComicVineDeepCatalog() {
  const updated = await syncComicVineVolumes({
    pages: 120,
    sort: "date_last_updated:desc",
  });

  const added = await syncComicVineVolumes({
    pages: 60,
    sort: "date_added:desc",
  });

  return {
    titlesCreated: updated.titlesCreated + added.titlesCreated,
    titlesUpdated: updated.titlesUpdated + added.titlesUpdated,
  };
}
