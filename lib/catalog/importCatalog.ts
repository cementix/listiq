import {
  syncAniListDeepCatalog,
  syncAniListSeedCatalog,
} from "@/lib/sync/providers/anilist";
import {
  syncRawgDeepCatalog,
  syncRawgSeedCatalog,
} from "@/lib/sync/providers/rawg";
import {
  syncTmdbDeepCatalog,
  syncTmdbPopular,
  syncTmdbTopRated,
  syncTmdbTrending,
} from "@/lib/sync/providers/tmdb";
import {
  syncGoogleBooksDailyCatalog,
  syncGoogleBooksDeepCatalog,
} from "@/lib/sync/providers/googleBooks";
import {
  syncComicVineDailyCatalog,
  syncComicVineDeepCatalog,
} from "@/lib/sync/providers/comicVine";
import { setSyncProgress } from "@/lib/sync/syncUtils";
import type { SeedMode, SeedProvider } from "./types";

async function syncTmdbSeedCatalog() {
  const popular = await syncTmdbPopular({
    pages: 20,
    minVoteCount: 300,
  });

  const rated = await syncTmdbTopRated({
    pages: 20,
    minVoteCount: 1000,
  });

  const trending = await syncTmdbTrending({
    pages: 3,
    minVoteCount: 100,
  });

  return {
    titlesCreated:
      popular.titlesCreated + rated.titlesCreated + trending.titlesCreated,
    titlesUpdated:
      popular.titlesUpdated + rated.titlesUpdated + trending.titlesUpdated,
  };
}

export async function importCatalog(
  provider?: SeedProvider,
  mode: SeedMode = "curated",
) {
  const tasks =
    mode === "broad"
      ? [
          { name: "google-books" as const, run: syncGoogleBooksDeepCatalog },
          { name: "comic-vine" as const, run: syncComicVineDeepCatalog },
          { name: "tmdb" as const, run: syncTmdbDeepCatalog },
          { name: "rawg" as const, run: syncRawgDeepCatalog },
          { name: "anilist" as const, run: syncAniListDeepCatalog },
        ]
      : [
          { name: "tmdb" as const, run: syncTmdbSeedCatalog },
          { name: "rawg" as const, run: syncRawgSeedCatalog },
          { name: "anilist" as const, run: syncAniListSeedCatalog },
          { name: "google-books" as const, run: syncGoogleBooksDailyCatalog },
          { name: "comic-vine" as const, run: syncComicVineDailyCatalog },
        ];

  const results: {
    provider: SeedProvider;
    titlesCreated: number;
    titlesUpdated: number;
  }[] = [];
  const failures: { provider: SeedProvider; error: unknown }[] = [];

  if (provider && !tasks.some((task) => task.name === provider)) {
    throw new Error(`Unknown catalog provider: ${provider}`);
  }

  for (const task of tasks) {
    if (provider && task.name !== provider) continue;

    console.log(`[catalog] ${mode}: ${task.name}`);
    setSyncProgress(`catalog:${task.name}`, "starting");

    try {
      const result = await task.run();
      results.push({ provider: task.name, ...result });

      console.log(
        `[catalog] ${task.name}: created=${result.titlesCreated}, updated=${result.titlesUpdated}`,
      );
    } catch (error) {
      failures.push({ provider: task.name, error });
      console.error(`[catalog] ${task.name} failed:`, error);
      setSyncProgress(`catalog:${task.name}`, "failed; continuing");
    }
  }

  return { results, failures };
}
