import { TitleType } from "@/generated/prisma/enums";

export type DashboardTitle = {
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
  }[];
};

export type RailIcon = "flame" | "calendar" | "dice" | "star";

export type DashboardRailItem = {
  title: string;
  href: string;
  icon: RailIcon;
  titles: DashboardTitle[];
};
