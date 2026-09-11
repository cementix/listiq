import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/actions/title/generateUniqueSlug";
import { slugify } from "@/actions/title/slugify";

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

function getTmdbAccessToken() {
  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    throw new Error("TMDB_ACCESS_TOKEN is not set");
  }

  return token;
}

async function fetchTmdb<T>(path: string) {
  const response = await fetch(`${TMDB_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${getTmdbAccessToken()}`,
      Accept: "application/json",
    },
  });

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

export async function fetchTrendingTmdbMovies(
  page = 1,
  genresByTmdbId?: TmdbGenreMap,
) {
  const data = await fetchTmdb<TmdbTrendingResponse<TmdbTrendingMovie>>(
    `/trending/movie/week?language=en-US&page=${page}`,
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

export async function syncTrendingTmdbMovies(options?: { pages?: number }) {
  const pages = options?.pages ?? 25;
  const genresByTmdbId = await fetchTmdbMovieGenres();

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = 1; page <= pages; page++) {
    const movies = await fetchTrendingTmdbMovies(page, genresByTmdbId);

    for (const movie of movies) {
      if (movie.isAdult || !movie.imageUrl || !movie.backdropUrl) {
        continue;
      }

      for (const genre of movie.genres) {
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
            provider: "TMDB_MOVIE",
            externalId: movie.externalId,
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
            name: movie.name,
            year: movie.year,
            description: movie.description,
            imageUrl: movie.imageUrl,
            backdropUrl: movie.backdropUrl,
            releaseDate: movie.releaseDate,
            genres: {
              set: movie.genres.map((genre) => ({
                slug: genre.slug,
              })),
            },
          },
        });

        await prisma.externalTitle.update({
          where: {
            provider_externalId: {
              provider: "TMDB_MOVIE",
              externalId: movie.externalId,
            },
          },
          data: {
            rawData: movie.rawData,
            lastSyncedAt: new Date(),
          },
        });

        titlesUpdated += 1;
        continue;
      }

      const baseSlug = slugify(movie.name);

      if (!baseSlug) {
        continue;
      }

      const slug = await generateUniqueSlug(movie.name);

      const title = await prisma.title.create({
        data: {
          name: movie.name,
          slug,
          type: "MOVIE",
          year: movie.year,
          description: movie.description,
          imageUrl: movie.imageUrl,
          backdropUrl: movie.backdropUrl,
          releaseDate: movie.releaseDate,
          externalTitles: {
            create: {
              provider: "TMDB_MOVIE",
              externalId: movie.externalId,
              externalUrl: `https://www.themoviedb.org/movie/${movie.externalId}`,
              rawData: movie.rawData,
              lastSyncedAt: new Date(),
            },
          },
          genres: {
            connect: movie.genres.map((genre) => ({
              slug: genre.slug,
            })),
          },
        },
      });

      if (title) {
        titlesCreated += 1;
      }
    }
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

export async function fetchTrendingTmdbTv(
  page = 1,
  genresByTmdbId?: TmdbGenreMap,
) {
  const data = await fetchTmdb<TmdbTrendingResponse<TmdbTrendingTv>>(
    `/trending/tv/week?language=en-US&page=${page}`,
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

export async function syncTrendingTmdbTv(options?: { pages?: number }) {
  const pages = options?.pages ?? 25;
  const genresByTmdbId = await fetchTmdbTvGenres();

  let titlesCreated = 0;
  let titlesUpdated = 0;

  for (let page = 1; page <= pages; page++) {
    const shows = await fetchTrendingTmdbTv(page, genresByTmdbId);

    for (const show of shows) {
      if (show.isAdult || !show.imageUrl || !show.backdropUrl) {
        continue;
      }

      for (const genre of show.genres) {
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
            provider: "TMDB_TV",
            externalId: show.externalId,
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
            name: show.name,
            year: show.year,
            description: show.description,
            imageUrl: show.imageUrl,
            backdropUrl: show.backdropUrl,
            releaseDate: show.releaseDate,
            genres: {
              set: show.genres.map((genre) => ({
                slug: genre.slug,
              })),
            },
          },
        });

        await prisma.externalTitle.update({
          where: {
            provider_externalId: {
              provider: "TMDB_TV",
              externalId: show.externalId,
            },
          },
          data: {
            rawData: show.rawData,
            lastSyncedAt: new Date(),
          },
        });

        titlesUpdated += 1;
        continue;
      }

      const baseSlug = slugify(show.name);

      if (!baseSlug) {
        continue;
      }

      const slug = await generateUniqueSlug(show.name);

      const title = await prisma.title.create({
        data: {
          name: show.name,
          slug,
          type: "SERIES",
          year: show.year,
          description: show.description,
          imageUrl: show.imageUrl,
          backdropUrl: show.backdropUrl,
          releaseDate: show.releaseDate,
          externalTitles: {
            create: {
              provider: "TMDB_TV",
              externalId: show.externalId,
              externalUrl: `https://www.themoviedb.org/tv/${show.externalId}`,
              rawData: show.rawData,
              lastSyncedAt: new Date(),
            },
          },
          genres: {
            connect: show.genres.map((genre) => ({
              slug: genre.slug,
            })),
          },
        },
      });

      if (title) {
        titlesCreated += 1;
      }
    }
  }

  return {
    titlesCreated,
    titlesUpdated,
  };
}

export async function syncTmdbTrending(options?: { pages?: number }) {
  const movies = await syncTrendingTmdbMovies(options);
  const tv = await syncTrendingTmdbTv(options);

  return {
    titlesCreated: movies.titlesCreated + tv.titlesCreated,
    titlesUpdated: movies.titlesUpdated + tv.titlesUpdated,
  };
}
