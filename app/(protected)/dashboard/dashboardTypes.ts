import { TitleType } from "@/generated/prisma/enums";
import type { CatalogSourceLink } from "@/lib/catalog/attribution";

export type DashboardTitle = {
  externalTitles?: CatalogSourceLink[];
  id: string;
  name: string;
  slug: string;
  type: TitleType;
  year: number | null;
  description: string | null;
  imageUrl: string | null;
  backdropUrl: string | null;
  releaseDate: Date | null;
  genres: {
    id: string;
    name: string;
    slug: string;
  }[];
  users: {
    rating: number | null;
    note: string | null;
    user: {
      libraryPublic: boolean;
      reviewsPublic: boolean;
    };
  }[];
};

export type RailIcon = "flame" | "calendar" | "dice" | "star" | "list";

export type DashboardRailItem = {
  title: string;
  href: string;
  icon: RailIcon;
  titles: DashboardTitle[];
};
