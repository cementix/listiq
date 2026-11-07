import type { SeedProvider } from "@/lib/catalog/types";
import { providerImportEnabled, replacementSyncEnabled } from "./providerPolicy";

export type DailyPage = { provider: SeedProvider | "open-library" | "wikidata"; section: string; page: number };
export const catalogTypes = ["MOVIE", "SERIES", "ANIME", "MANGA", "MANHWA", "BOOK", "GAME", "NOVEL", "COMIC", "OTHER"] as const;

/** Each task imports one provider page; no task repeats an entire seed. */
export function dailySyncPlan(): DailyPage[] {
  const jobs: DailyPage[] = [];
  const add = (provider: SeedProvider, section: string, pages: number, first = 1) => {
    if (!providerImportEnabled(provider)) return;
    for (let page = first; page < first + pages; page++) jobs.push({ provider, section, page });
  };
  add("tmdb", "expire", 1);
  add("tmdb", "popular", 20); add("tmdb", "rated", 20); add("tmdb", "trending", 3);
  add("rawg", "popular", 15); add("rawg", "rated", 10); add("rawg", "acclaimed", 8);
  add("anilist", "ANIME", 12); add("anilist", "MANGA", 8);
  add("anilist", "MANHWA", 5); add("anilist", "NOVEL", 5);
  for (const query of ["subject:fiction", "subject:fantasy", "subject:science fiction", "subject:mystery", "subject:comics"]) {
    add("google-books", `relevance|${query}`, 2, 0); add("google-books", `newest|${query}`, 1, 0);
  }
  add("comic-vine", "updated", 10, 0);
  for (const provider of ["manga-updates", "open-library", "wikidata"] as const) {
    if (replacementSyncEnabled(provider)) jobs.push({ provider, section: "curated", page: 1 });
  }
  add("tmdb", "refresh", 2);
  return jobs;
}
