
import { logError } from "@/lib/observability/errors";
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import {
  syncTitlesDaily,
  syncTitlesDeep,
  syncTitlesProvider,
} from "@/lib/sync/syncTitles";
import { getSyncProgressSnapshot } from "@/lib/sync/syncUtils";

function startHeartbeat() {
  const startedAt = Date.now();

  return setInterval(() => {
    const progress = getSyncProgressSnapshot();
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const detail = progress.detail ? ` | ${progress.detail}` : "";

    console.log(
      `[sync:heartbeat] ${elapsedSeconds}s | ${progress.label}${detail} | created=${progress.titlesCreated} updated=${progress.titlesUpdated}`,
    );
  }, 5000);
}

async function main() {
  const mode = process.argv[2] ?? "daily";
  const provider = process.argv[3];
  const heartbeat = startHeartbeat();

  try {
    const result = provider
      ? await syncTitlesProvider(
          provider as "tmdb" | "rawg" | "anilist" | "google-books" | "comic-vine",
          mode === "deep" ? "deep" : "daily",
        )
      : mode === "deep"
        ? await syncTitlesDeep()
        : await syncTitlesDaily();

    console.dir(result, { depth: null });
  } finally {
    clearInterval(heartbeat);
  }
}

main()
  .catch((error) => {
    logError("scripts.syncTitles", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
