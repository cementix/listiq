import { providerRequest } from "@/lib/sync/providerRequest";
import { generateUniqueSlug } from "@/lib/title/generateUniqueSlug";
import { slugify } from "@/lib/title/slugify";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { upsertTitleAlias } from "@/lib/sync/titleAliases";
import {
  setSyncProgress,
  sleep,
  type SyncResult,
} from "@/lib/sync/syncUtils";

const GOOGLE_BOOKS_API_BASE_URL = "https://www.googleapis.com/books/v1";
const GOOGLE_BOOKS_PAGE_SIZE = 40;
const GOOGLE_BOOKS_REQUEST_DELAY_MS = 500;

type GoogleBookVolume = {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    categories?: string[];
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    canonicalVolumeLink?: string;
    infoLink?: string;
  };
};

type GoogleBooksResponse = {
  totalItems: number;
  items?: GoogleBookVolume[];
};

type MappedGoogleBook = {
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
    kind: "PRIMARY" | "ENGLISH" | "SYNONYM";
  }[];
  genres: {
    name: string;
    slug: string;
  }[];
};

type SyncGoogleBooksOptions = {
  startPage?: number;
  pagesPerQuery?: number;
  queries?: string[];
  orderBy?: "relevance" | "newest";
};

const DEEP_BOOK_QUERIES = [
  "subject:fiction",
  "subject:fantasy",
  "subject:science fiction",
  "subject:dystopian",
  "subject:urban fantasy",
  "subject:paranormal fiction",
  "subject:mystery",
  "subject:thriller",
  "subject:horror",
  "subject:romance",
  "subject:contemporary romance",
  "subject:historical romance",
  "subject:historical fiction",
  "subject:young adult fiction",
  "subject:juvenile fiction",
  "subject:literary fiction",
  "subject:adventure",
  "subject:crime",
  "subject:detective",
  "subject:classics",
  "subject:graphic novels",
  "subject:comics",
  "subject:manga",
  "subject:superheroes",
  "subject:biography",
  "subject:autobiography",
  "subject:memoir",
  "subject:history",
  "subject:science",
  "subject:philosophy",
  "subject:psychology",
  "subject:self-help",
  "subject:business",
  "subject:economics",
  "subject:technology",
  "subject:programming",
  "subject:art",
  "subject:music",
  "subject:film",
  "subject:poetry",
  "subject:religion",
  "subject:travel",
  "subject:cooking",
];

const DAILY_BOOK_QUERIES = [
  "subject:fiction",
  "subject:fantasy",
  "subject:science fiction",
  "subject:mystery",
  "subject:comics",
];

function getGoogleBooksApiKey() {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_BOOKS_API_KEY is not set");
  }

  return apiKey;
}

async function fetchGoogleBooks<T>(
  path: string,
  params: Record<string, string | number>
): Promise<T> {
const search = new URLSearchParams({ key: getGoogleBooksApiKey(), ...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)])) }); const response = await providerRequest("Google Books", GOOGLE_BOOKS_API_BASE_URL + path + "?" + search); return response.json() as Promise<T>;
}

function parsePublishedDate(value?: string) {
  if (!value) {
    return {
      releaseDate: null,
      year: null,
    };
  }

  const year = Number(value.slice(0, 4));

  if (!Number.isFinite(year)) {
    return {
      releaseDate: null,
      year: null,
    };
  }

  const releaseDate =
    value.length >= 10
      ? new Date(value)
      : new Date(Date.UTC(year, 0, 1));

  return {
    releaseDate: Number.isNaN(releaseDate.getTime()) ? null : releaseDate,
    year,
  };
}

function getGoogleBookImageUrl(volume: GoogleBookVolume) {
  const imageLinks = volume.volumeInfo?.imageLinks;
  const url =
    imageLinks?.extraLarge ||
    imageLinks?.large ||
    imageLinks?.medium ||
    imageLinks?.small ||
    imageLinks?.thumbnail ||
    imageLinks?.smallThumbnail;

  return url ? url.replace(/^http:\/\//, "https://") : null;
}

function mapGoogleBook(volume: GoogleBookVolume): MappedGoogleBook | null {
  const info = volume.volumeInfo;
  const name = info?.title?.trim();

  if (!info || !name || !slugify(name)) {
    return null;
  }

  const { releaseDate, year } = parsePublishedDate(info.publishedDate);
  const subtitle = info.subtitle?.trim();

  return {
    externalId: volume.id,
    name,
    description: info.description?.trim() || null,
    releaseDate,
    year,
    imageUrl: getGoogleBookImageUrl(volume),
    externalUrl: info.canonicalVolumeLink || info.infoLink || null,
    rawData: volume as Prisma.InputJsonValue,
    aliases: [
      { value: name, kind: "PRIMARY" },
      ...(subtitle ? [{ value: `${name}: ${subtitle}`, kind: "SYNONYM" as const }] : []),
    ],
    genres: (info.categories ?? []).map((category) => ({
      name: category,
      slug: slugify(category),
    })),
  };
}

async function upsertGoogleBook(book: MappedGoogleBook) {
  if (!book.imageUrl) {
    return "skipped" as const;
  }

  for (const genre of book.genres) {
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
        provider: "GOOGLE_BOOKS",
        externalId: book.externalId,
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
        name: book.name,
        year: book.year,
        description: book.description,
        imageUrl: book.imageUrl,
        backdropUrl: book.imageUrl,
        releaseDate: book.releaseDate,
        genres: {
          set: book.genres.map((genre) => ({
            slug: genre.slug,
          })),
        },
      },
    });

    await prisma.externalTitle.update({
      where: {
        provider_externalId: {
          provider: "GOOGLE_BOOKS",
          externalId: book.externalId,
        },
      },
      data: {
        externalUrl: book.externalUrl,
        rawData: book.rawData,
        lastSyncedAt: new Date(),
      },
    });

    await upsertTitleAlias(
      existingExternalTitle.titleId,
      book.aliases.map((alias) => ({
        ...alias,
        source: "GOOGLE_BOOKS",
      })),
    );

    return "updated" as const;
  }

  const baseSlug = slugify(book.name);
  const existingTitle = await prisma.title.findFirst({
    where: {
      type: "BOOK",
      OR: [
        { slug: baseSlug },
        { name: { equals: book.name, mode: "insensitive" } },
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
        provider: "GOOGLE_BOOKS",
        externalId: book.externalId,
        externalUrl: book.externalUrl,
        rawData: book.rawData,
        lastSyncedAt: new Date(),
      },
    });

    await upsertTitleAlias(
      existingTitle.id,
      book.aliases.map((alias) => ({
        ...alias,
        source: "GOOGLE_BOOKS",
      })),
    );

    return "updated" as const;
  }

  const title = await prisma.title.create({
    data: {
      name: book.name,
      slug: await generateUniqueSlug(book.name),
      type: "BOOK",
      year: book.year,
      description: book.description,
      imageUrl: book.imageUrl,
      backdropUrl: book.imageUrl,
      releaseDate: book.releaseDate,
      externalTitles: {
        create: {
          provider: "GOOGLE_BOOKS",
          externalId: book.externalId,
          externalUrl: book.externalUrl,
          rawData: book.rawData,
          lastSyncedAt: new Date(),
        },
      },
      genres: {
        connect: book.genres.map((genre) => ({
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
    book.aliases.map((alias) => ({
      ...alias,
      source: "GOOGLE_BOOKS",
    })),
  );

  return "created" as const;
}

async function syncGoogleBooksQuery(
  query: string,
  options: Required<Pick<SyncGoogleBooksOptions, "pagesPerQuery" | "orderBy">> & { startPage?: number },
): Promise<SyncResult> {
  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = options.startPage ?? 0; page < (options.startPage ?? 0) + options.pagesPerQuery; page++) {
    setSyncProgress(
      "google-books",
      `${options.orderBy} ${query} page ${page + 1}/${options.pagesPerQuery}`,
      {
        titlesCreated,
        titlesUpdated,
      },
    );

    const data = await fetchGoogleBooks<GoogleBooksResponse>("/volumes", {
      q: query,
      printType: "books",
      projection: "full",
      orderBy: options.orderBy,
      maxResults: GOOGLE_BOOKS_PAGE_SIZE,
      startIndex: page * GOOGLE_BOOKS_PAGE_SIZE,
    });

    const books = (data.items ?? []).flatMap((volume) => {
      const book = mapGoogleBook(volume);

      return book ? [book] : [];
    });

    if (books.length === 0) {
      break;
    }

    for (const book of books) {
      const result = await upsertGoogleBook(book);

      if (result === "created") {
        titlesCreated += 1;
      }

      if (result === "updated") {
        titlesUpdated += 1;
      }
    }

    await sleep(GOOGLE_BOOKS_REQUEST_DELAY_MS);
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

export async function syncGoogleBooksCatalog(
  options?: SyncGoogleBooksOptions,
): Promise<SyncResult> {
  const queries = options?.queries ?? DAILY_BOOK_QUERIES;
  const pagesPerQuery = options?.pagesPerQuery ?? 2;
  const orderBy = options?.orderBy ?? "relevance";

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (const query of queries) {
    const result = await syncGoogleBooksQuery(query, {
      pagesPerQuery,
      orderBy,
      startPage: options?.startPage,
    });

    titlesCreated += result.titlesCreated;
    titlesUpdated += result.titlesUpdated;
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

export async function syncGoogleBooksDailyCatalog() {
  const relevance = await syncGoogleBooksCatalog({
    queries: DAILY_BOOK_QUERIES,
    pagesPerQuery: 2,
    orderBy: "relevance",
  });

  const newest = await syncGoogleBooksCatalog({
    queries: DAILY_BOOK_QUERIES,
    pagesPerQuery: 1,
    orderBy: "newest",
  });

  return {
    titlesCreated: relevance.titlesCreated + newest.titlesCreated,
    titlesUpdated: relevance.titlesUpdated + newest.titlesUpdated,
  };
}

export async function syncGoogleBooksDeepCatalog() {
  const relevance = await syncGoogleBooksCatalog({
    queries: DEEP_BOOK_QUERIES,
    pagesPerQuery: 25,
    orderBy: "relevance",
  });

  const newest = await syncGoogleBooksCatalog({
    queries: DEEP_BOOK_QUERIES,
    pagesPerQuery: 15,
    orderBy: "newest",
  });

  return {
    titlesCreated: relevance.titlesCreated + newest.titlesCreated,
    titlesUpdated: relevance.titlesUpdated + newest.titlesUpdated,
  };
}
