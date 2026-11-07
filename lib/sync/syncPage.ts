import "server-only";
import { syncMangaUpdatesCatalog } from "./providers/mangaUpdates";
import type { DailyPage } from "./dailyPlan";
import { expireTmdbCache, refreshStaleTmdbTitles, syncTmdbPopular, syncTmdbTopRated, syncTmdbTrending } from "./providers/tmdb";
import { syncOpenCatalog } from "./providers/openCatalog";
import { syncRawgGamesFromParams } from "./providers/rawg";
import { syncAniListMedia } from "./providers/anilist";
import { syncGoogleBooksCatalog } from "./providers/googleBooks";
import { syncComicVineVolumes } from "./providers/comicVine";

export async function syncCatalogPage(job: DailyPage) {
  const startPage = job.page;
  switch (job.provider) {
    case "manga-updates": return syncMangaUpdatesCatalog({ limitPerType: 5 });
    case "open-library":
    case "wikidata": return syncOpenCatalog(job.provider);
    case "tmdb": {
      if (job.section === "expire") {
        await expireTmdbCache();
        return { titlesCreated: 0, titlesUpdated: 0 };
      }
      if (job.section === "refresh") return refreshStaleTmdbTitles();
      if (job.section === "popular") return syncTmdbPopular({ pages: 1, startPage, minVoteCount: 300 });
      if (job.section === "rated") return syncTmdbTopRated({ pages: 1, startPage, minVoteCount: 1000 });
      return syncTmdbTrending({ pages: 1, startPage, minVoteCount: 100 });
    }
    case "rawg": {
      const params = job.section === "popular" ? { ordering: "-added" } : job.section === "rated" ? { ordering: "-rating" } : { ordering: "-metacritic", metacritic: "80,100" };
      const minRatingCount = job.section === "popular" ? 200 : job.section === "rated" ? 300 : 150;
      return syncRawgGamesFromParams(params, { pages: 1, startPage, minRatingCount });
    }
    case "anilist": {
      const options = { pages: 1, startPage };
      if (job.section === "ANIME") return syncAniListMedia({ type: "ANIME", titleType: "ANIME", format: ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"], sort: ["POPULARITY_DESC"], options: { ...options, minPopularity: 5000 } });
      if (job.section === "MANGA") return syncAniListMedia({ type: "MANGA", titleType: "MANGA", format: ["MANGA", "ONE_SHOT"], countryOfOrigin: "JP", sort: ["POPULARITY_DESC"], options: { ...options, minPopularity: 1500 } });
      if (job.section === "MANHWA") return syncAniListMedia({ type: "MANGA", titleType: "MANHWA", format: ["MANGA"], countryOfOrigin: "KR", sort: ["POPULARITY_DESC"], options: { ...options, minPopularity: 800 } });
      return syncAniListMedia({ type: "MANGA", titleType: "NOVEL", format: ["NOVEL"], sort: ["POPULARITY_DESC"], options: { ...options, minPopularity: 800 } });
    }
    case "google-books": {
      const [order, query] = job.section.split("|");
      return syncGoogleBooksCatalog({ queries: [query], orderBy: order === "newest" ? "newest" : "relevance", pagesPerQuery: 1, startPage });
    }
    case "comic-vine": return syncComicVineVolumes({ pages: 1, startPage, sort: "date_last_updated:desc" });
  }
}

