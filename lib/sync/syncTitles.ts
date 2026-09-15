import {
  syncAniListDailyCatalog,
  syncAniListDeepCatalog,
} from "./providers/anilist";
import {
  syncComicVineDailyCatalog,
  syncComicVineDeepCatalog,
} from "./providers/comicVine";
import {
  syncGoogleBooksDailyCatalog,
  syncGoogleBooksDeepCatalog,
} from "./providers/googleBooks";
import { syncRawgDailyCatalog, syncRawgDeepCatalog } from "./providers/rawg";
import { syncTmdbDailyCatalog, syncTmdbDeepCatalog } from "./providers/tmdb";
import { runDailySyncOnce } from "./syncRun";
import { runSyncStep, sumSyncResults } from "./syncUtils";

async function syncAllTitlesDaily() {
  const results = await Promise.all([
    runSyncStep("tmdb:daily", syncTmdbDailyCatalog),
    runSyncStep("rawg:daily", syncRawgDailyCatalog),
    runSyncStep("anilist:daily", syncAniListDailyCatalog),
    runSyncStep("google-books:daily", syncGoogleBooksDailyCatalog),
    runSyncStep("comic-vine:daily", syncComicVineDailyCatalog),
  ]);

  return {
    ...sumSyncResults(results),
    providers: results,
  };
}

export async function syncTitlesDaily() {
  return runDailySyncOnce(syncAllTitlesDaily);
}

export async function syncTitlesDeep() {
  const results = [];

  results.push(await runSyncStep("tmdb:deep", syncTmdbDeepCatalog));
  results.push(await runSyncStep("rawg:deep", syncRawgDeepCatalog));
  results.push(await runSyncStep("anilist:deep", syncAniListDeepCatalog));
  results.push(await runSyncStep("google-books:deep", syncGoogleBooksDeepCatalog));
  results.push(await runSyncStep("comic-vine:deep", syncComicVineDeepCatalog));

  return {
    ...sumSyncResults(results),
    providers: results,
  };
}

export async function syncTitlesProvider(
  provider: "tmdb" | "rawg" | "anilist" | "google-books" | "comic-vine",
  mode: "daily" | "deep",
) {
  const taskByProvider = {
    tmdb: mode === "deep" ? syncTmdbDeepCatalog : syncTmdbDailyCatalog,
    rawg: mode === "deep" ? syncRawgDeepCatalog : syncRawgDailyCatalog,
    anilist:
      mode === "deep" ? syncAniListDeepCatalog : syncAniListDailyCatalog,
    "google-books":
      mode === "deep"
        ? syncGoogleBooksDeepCatalog
        : syncGoogleBooksDailyCatalog,
    "comic-vine":
      mode === "deep" ? syncComicVineDeepCatalog : syncComicVineDailyCatalog,
  };

  const result = await runSyncStep(
    `${provider}:${mode}`,
    taskByProvider[provider],
  );

  return {
    titlesCreated: result.titlesCreated,
    titlesUpdated: result.titlesUpdated,
    providers: [result],
  };
}
