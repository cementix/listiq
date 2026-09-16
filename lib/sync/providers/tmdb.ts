import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/actions/title/generateUniqueSlug";
import { slugify } from "@/actions/title/slugify";
import { Prisma } from "@/generated/prisma/client";
import { setSyncProgress } from "@/lib/sync/syncUtils";

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

type TmdbTrendingMovie = {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids: number[];
  popularity: number;
  vote_average: number;
  vote_count: number;
  adult: boolean;
};

type TmdbTrendingTv = {
  id: number;
  name: string;
  overview: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids: number[];
  popularity: number;
  vote_average: number;
  vote_count: number;
  adult?: boolean;
  origin_country: string[];
};

type TmdbTrendingResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

type TmdbGenre = {
  id: number;
  name: string;
};

type TmdbGenreResponse = {
  genres: TmdbGenre[];
};

type TmdbGenreMap = Map<
  number,
  {
    name: string;
    slug: string;
  }
>;

type MappedTmdbTitle = {
  externalId: string;
  name: string;
  description: string | null;
  releaseDate: Date | null;
  year: number | null;
  imageUrl: string | null;
  backdropUrl: string | null;
  voteCount: number;
  isAdult: boolean;
  rawData: Prisma.InputJsonValue;
  genres: {
    name: string;
    slug: string;
  }[];
};

type SyncTmdbOptions = {
  pages?: number;
  minVoteCount?: number;
};

type SyncResult = {
  titlesCreated: number;
  titlesUpdated: number;
};

function getTmdbAccessToken() {
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    throw new Error("TMDB_ACCESS_TOKEN is not set");
  }

  return token;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(response: Response, attempt: number) {
  const retryAfter = Number(response.headers.get("retry-after"));

  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }

  return Math.min(1000 * 2 ** attempt, 30_000);
}

async function fetchTmdb<T>(path: string, attempt = 0): Promise<T> {
  const response = await fetch(`${TMDB_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${getTmdbAccessToken()}`,
      Accept: "application/json",
    },
  });

  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    await sleep(getRetryDelayMs(response, attempt));

    return fetchTmdb<T>(path, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`TMDB request failed ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function getTmdbImageUrl(path: string | null | undefined, size = "w500") {
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export async function fetchTmdbMoviesFromPath(
  path: string,
  page = 1,
  genresByTmdbId?: TmdbGenreMap,
) {
  const separator = path.includes("?") ? "&" : "?";

  const data = await fetchTmdb<TmdbTrendingResponse<TmdbTrendingMovie>>(
    `${path}${separator}language=en-US&page=${page}`,
  );

  const genres = genresByTmdbId ?? (await fetchTmdbMovieGenres());

  return data.results.map((movie) => ({
    externalId: String(movie.id),
    name: movie.title,
    description: movie.overview || null,
    releaseDate: movie.release_date ? new Date(movie.release_date) : null,
    year: movie.release_date
      ? new Date(movie.release_date).getUTCFullYear()
      : null,
    imageUrl: getTmdbImageUrl(movie.poster_path, "w500"),
    backdropUrl: getTmdbImageUrl(movie.backdrop_path, "w1280"),
    popularity: movie.popularity,
    voteAverage: movie.vote_average,
    voteCount: movie.vote_count,
    isAdult: movie.adult,
    rawData: movie,
    genres: movie.genre_ids.flatMap((genreId) => {
      const genre = genres.get(genreId);

      return genre ? [genre] : [];
    }),
  }));
}

async function upsertTmdbTitle({
  title,
  provider,
  type,
  externalUrl,
}: {
  title: MappedTmdbTitle;
  provider: "TMDB_MOVIE" | "TMDB_TV";
  type: "MOVIE" | "SERIES";
  externalUrl: string;
}) {
  if (
    title.isAdult ||
    !title.imageUrl ||
    !title.backdropUrl ||
    !slugify(title.name)
  ) {
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
        provider,
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
          provider,
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
          provider,
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

export async function syncTrendingTmdbMovies(
  options?: SyncTmdbOptions,
): Promise<SyncResult> {
  const pages = options?.pages ?? 25;
  const genresByTmdbId = await fetchTmdbMovieGenres();

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = 1; page <= pages; page++) {
    setSyncProgress("tmdb", `trending movies page ${page}/${pages}`, {
      titlesCreated,
      titlesUpdated,
    });

    const movies = await fetchTmdbMoviesFromPath(
      "/trending/movie/week",
      page,
      genresByTmdbId,
    );

    const result = await syncMappedTmdbTitles({
      titles: movies,
      minVoteCount: options?.minVoteCount,
      provider: "TMDB_MOVIE",
      type: "MOVIE",
      buildExternalUrl: (externalId) =>
        `https://www.themoviedb.org/movie/${externalId}`,
    });

    titlesCreated += result.titlesCreated;
    titlesUpdated += result.titlesUpdated;
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

function normalizeTmdbGenreName(name: string) {
  if (name === "Science Fiction") {
    return "Sci-Fi";
  }

  return name;
}

async function fetchTmdbMovieGenres() {
  const data = await fetchTmdb<TmdbGenreResponse>(
    "/genre/movie/list?language=en-US",
  );

  return new Map(
    data.genres.map((genre) => {
      const name = normalizeTmdbGenreName(genre.name);

      return [
        genre.id,
        {
          name,
          slug: slugify(name),
        },
      ];
    }),
  );
}

async function fetchTmdbTvGenres() {
  const data = await fetchTmdb<TmdbGenreResponse>(
    "/genre/tv/list?language=en-US",
  );

  return new Map(
    data.genres.map((genre) => {
      const name = normalizeTmdbGenreName(genre.name);

      return [
        genre.id,
        {
          name,
          slug: slugify(name),
        },
      ];
    }),
  );
}

export async function fetchTmdbTvFromPath(
  path: string,
  page = 1,
  genresByTmdbId?: TmdbGenreMap,
) {
  const separator = path.includes("?") ? "&" : "?";

  const data = await fetchTmdb<TmdbTrendingResponse<TmdbTrendingTv>>(
    `${path}${separator}language=en-US&page=${page}`,
  );

  const genres = genresByTmdbId ?? (await fetchTmdbTvGenres());

  return data.results.map((show) => ({
    externalId: String(show.id),
    name: show.name,
    description: show.overview || null,
    releaseDate: show.first_air_date ? new Date(show.first_air_date) : null,
    year: show.first_air_date
      ? new Date(show.first_air_date).getUTCFullYear()
      : null,
    imageUrl: getTmdbImageUrl(show.poster_path, "w500"),
    backdropUrl: getTmdbImageUrl(show.backdrop_path, "w1280"),
    popularity: show.popularity,
    voteAverage: show.vote_average,
    voteCount: show.vote_count,
    isAdult: show.adult ?? false,
    rawData: show,
    genres: show.genre_ids.flatMap((genreId) => {
      const genre = genres.get(genreId);

      return genre ? [genre] : [];
    }),
  }));
}

export async function syncTrendingTmdbTv(
  options?: SyncTmdbOptions,
): Promise<SyncResult> {
  const pages = options?.pages ?? 25;
  const genresByTmdbId = await fetchTmdbTvGenres();

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = 1; page <= pages; page++) {
    setSyncProgress("tmdb", `trending tv page ${page}/${pages}`, {
      titlesCreated,
      titlesUpdated,
    });

    const shows = await fetchTmdbTvFromPath(
      "/trending/tv/week",
      page,
      genresByTmdbId,
    );

    const result = await syncMappedTmdbTitles({
      titles: shows,
      minVoteCount: options?.minVoteCount,
      provider: "TMDB_TV",
      type: "SERIES",
      buildExternalUrl: (externalId) =>
        `https://www.themoviedb.org/tv/${externalId}`,
    });

    titlesCreated += result.titlesCreated;
    titlesUpdated += result.titlesUpdated;
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

async function syncTmdbMoviesFromPath(
  path: string,
  options?: SyncTmdbOptions,
): Promise<SyncResult> {
  const pages = options?.pages ?? 25;
  const genresByTmdbId = await fetchTmdbMovieGenres();

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = 1; page <= pages; page++) {
    setSyncProgress("tmdb", `${path} movie page ${page}/${pages}`, {
      titlesCreated,
      titlesUpdated,
    });

    const movies = await fetchTmdbMoviesFromPath(path, page, genresByTmdbId);

    const result = await syncMappedTmdbTitles({
      titles: movies,
      minVoteCount: options?.minVoteCount,
      provider: "TMDB_MOVIE",
      type: "MOVIE",
      buildExternalUrl: (externalId) =>
        `https://www.themoviedb.org/movie/${externalId}`,
    });

    titlesCreated += result.titlesCreated;
    titlesUpdated += result.titlesUpdated;
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

async function syncTmdbTvFromPath(
  path: string,
  options?: SyncTmdbOptions,
): Promise<SyncResult> {
  const pages = options?.pages ?? 25;
  const genresByTmdbId = await fetchTmdbTvGenres();

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = 1; page <= pages; page++) {
    setSyncProgress("tmdb", `${path} tv page ${page}/${pages}`, {
      titlesCreated,
      titlesUpdated,
    });

    const shows = await fetchTmdbTvFromPath(path, page, genresByTmdbId);

    const result = await syncMappedTmdbTitles({
      titles: shows,
      minVoteCount: options?.minVoteCount,
      provider: "TMDB_TV",
      type: "SERIES",
      buildExternalUrl: (externalId) =>
        `https://www.themoviedb.org/tv/${externalId}`,
    });

    titlesCreated += result.titlesCreated;
    titlesUpdated += result.titlesUpdated;
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

async function syncMappedTmdbTitles({
  titles,
  minVoteCount = 0,
  provider,
  type,
  buildExternalUrl,
}: {
  titles: MappedTmdbTitle[];
  minVoteCount?: number;
  provider: "TMDB_MOVIE" | "TMDB_TV";
  type: "MOVIE" | "SERIES";
  buildExternalUrl: (externalId: string) => string;
}): Promise<SyncResult> {
  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (const title of titles) {
    if (title.voteCount < minVoteCount) {
      continue;
    }

    const result = await upsertTmdbTitle({
      title,
      provider,
      type,
      externalUrl: buildExternalUrl(title.externalId),
    });

    if (result === "created") {
      titlesCreated += 1;
    }

    if (result === "updated") {
      titlesUpdated += 1;
    }
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

export async function syncTmdbTrending(
  options?: SyncTmdbOptions,
): Promise<SyncResult> {
  const movies = await syncTrendingTmdbMovies(options);
  const tv = await syncTrendingTmdbTv(options);

  return {
    titlesCreated: movies.titlesCreated + tv.titlesCreated,
    titlesUpdated: movies.titlesUpdated + tv.titlesUpdated,
  };
}

export async function syncTmdbPopular(
  options?: SyncTmdbOptions,
): Promise<SyncResult> {
  const movies = await syncTmdbMoviesFromPath("/movie/popular", options);
  const tv = await syncTmdbTvFromPath("/tv/popular", options);

  return {
    titlesCreated: movies.titlesCreated + tv.titlesCreated,
    titlesUpdated: movies.titlesUpdated + tv.titlesUpdated,
  };
}

export async function syncTmdbTopRated(
  options?: SyncTmdbOptions,
): Promise<SyncResult> {
  const movies = await syncTmdbMoviesFromPath("/movie/top_rated", options);
  const tv = await syncTmdbTvFromPath("/tv/top_rated", options);

  return {
    titlesCreated: movies.titlesCreated + tv.titlesCreated,
    titlesUpdated: movies.titlesUpdated + tv.titlesUpdated,
  };
}

export async function syncTmdbDailyCatalog(): Promise<SyncResult> {
  const trending = await syncTmdbTrending({
    pages: 5,
    minVoteCount: 20,
  });

  const popular = await syncTmdbPopular({
    pages: 10,
    minVoteCount: 50,
  });

  const topRated = await syncTmdbTopRated({
    pages: 10,
    minVoteCount: 500,
  });

  return {
    titlesCreated:
      trending.titlesCreated + popular.titlesCreated + topRated.titlesCreated,
    titlesUpdated:
      trending.titlesUpdated + popular.titlesUpdated + topRated.titlesUpdated,
  };
}

export async function syncTmdbDeepCatalog(): Promise<SyncResult> {
  const trending = await syncTmdbTrending({
    pages: 70,
    minVoteCount: 20,
  });

  const popular = await syncTmdbPopular({
    pages: 300,
    minVoteCount: 20,
  });

  const topRated = await syncTmdbTopRated({
    pages: 250,
    minVoteCount: 200,
  });

  return {
    titlesCreated:
      trending.titlesCreated + popular.titlesCreated + topRated.titlesCreated,
    titlesUpdated:
      trending.titlesUpdated + popular.titlesUpdated + topRated.titlesUpdated,
  };
}
