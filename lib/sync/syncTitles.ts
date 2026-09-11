import { syncTrendingTmdbMovies } from "./providers/tmdb";
import { runDailySyncOnce } from "./syncRun";

async function syncAllTitles() {
  const tmdbMovieResult = await syncTrendingTmdbMovies();

  return {
    titlesCreated: tmdbMovieResult.titlesCreated,
    titlesUpdated: tmdbMovieResult.titlesUpdated,
  };
}

export async function syncTitlesDaily() {
  return runDailySyncOnce(syncAllTitles);
}
