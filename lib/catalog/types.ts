import type { ExternalTitleProvider, TitleType } from "@/generated/prisma/enums";

export type SeedProvider =
  | "manga-updates"
  | "tmdb"
  | "rawg"
  | "anilist"
  | "google-books"
  | "comic-vine";
export type SeedMode = "curated" | "broad";

export type CatalogSource = {
  id: string;
  titleId: string;
  provider: ExternalTitleProvider;
  rawData: unknown;
  sourcePopularity: number | null;
  sourceRating: number | null;
  sourceRatingCount: number | null;
  title: {
    type: TitleType;
    imageUrl: string | null;
    catalogScore: number | null;
    catalogEligible: boolean;
  };
};
