import type { ExternalTitleProvider } from "@/generated/prisma/enums";

export type ProviderSignals = {
  popularity: number | null;
  rating: number | null;
  ratingCount: number | null;
  ratingScale: number | null;
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function count(value: unknown): number | null {
  const number = nonNegativeNumber(value);
  return number === null ? null : Math.trunc(number);
}

export function extractProviderSignals(
  provider: ExternalTitleProvider,
  rawData: unknown,
): ProviderSignals {
  const data = asObject(rawData);

  if (!data) {
    return {
      popularity: null,
      rating: null,
      ratingCount: null,
      ratingScale: null,
    };
  }

  switch (provider) {
    case "TMDB_MOVIE":
    case "TMDB_TV":
      return {
        popularity: nonNegativeNumber(data.popularity),
        rating: nonNegativeNumber(data.vote_average),
        ratingCount: count(data.vote_count),
        ratingScale: 10,
      };

    case "ANILIST":
      return {
        popularity: nonNegativeNumber(data.popularity),
        rating: nonNegativeNumber(data.averageScore),
        ratingCount: null,
        ratingScale: 100,
      };

    case "RAWG":
      return {
        popularity: count(data.added),
        rating: nonNegativeNumber(data.rating),
        ratingCount: count(data.ratings_count),
        ratingScale: 5,
      };

    case "GOOGLE_BOOKS": {
      const info = asObject(data.volumeInfo);

      return {
        popularity: null,
        rating: nonNegativeNumber(info?.averageRating),
        ratingCount: count(info?.ratingsCount),
        ratingScale: 5,
      };
    }

    case "COMIC_VINE":
    case "OPEN_LIBRARY":
      return {
        popularity: null,
        rating: null,
        ratingCount: null,
        ratingScale: null,
      };
  }
}
