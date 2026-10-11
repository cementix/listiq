import "dotenv/config";

import { seedCatalog } from "@/lib/catalog/seedCatalog";
import type { SeedMode, SeedProvider } from "@/lib/catalog/types";
import { prisma } from "@/lib/prisma";
import { getSyncProgressSnapshot } from "@/lib/sync/syncUtils";

const providers: SeedProvider[] = [
  "google-books",
  "comic-vine",
  "tmdb",
  "rawg",
  "anilist",
];

async function main() {
  const modeArg = process.argv[2] ?? "broad";
  const providerArg = process.argv[3];

  if (modeArg !== "curated" && modeArg !== "broad") {
    throw new Error("Mode must be curated or broad");
  }

  if (providerArg && !providers.includes(providerArg as SeedProvider)) {
    throw new Error(`Unknown catalog provider: ${providerArg}`);
  }

  const mode: SeedMode = modeArg;
  const provider = providerArg as SeedProvider | undefined;
  const startedAt = Date.now();
  const initialTotal = await prisma.title.count();
  let currentTotal = initialTotal;
  let heartbeatCount = 0;
  let countPending = false;

  console.log(
    `[seed] mode=${mode} provider=${provider ?? "all"} startingTitles=${initialTotal}`,
  );

  const heartbeat = setInterval(() => {
    const progress = getSyncProgressSnapshot();
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const idle = Math.floor(
      (Date.now() - progress.updatedAt.getTime()) / 1000,
    );

    console.log(
      `[seed] ${elapsed}s | ${progress.label} | ${progress.detail ?? "working"} | stageCreated=${progress.titlesCreated} stageUpdated=${progress.titlesUpdated} | titles=${currentTotal} (+${currentTotal - initialTotal}) | lastProgress=${idle}s ago`,
    );

    heartbeatCount += 1;

    // Refresh the database total every 30 seconds without blocking the heartbeat.
    if (heartbeatCount % 6 === 0 && !countPending) {
      countPending = true;
      void prisma.title
        .count()
        .then((total) => {
          currentTotal = total;
        })
        .catch((error) => {
          console.warn("[seed] Could not refresh title count:", error);
        })
        .finally(() => {
          countPending = false;
        });
    }
  }, 5000);

  try {
    const result = await seedCatalog(provider, mode);
    console.dir(result, { depth: null });
  } finally {
    clearInterval(heartbeat);
    const finalTotal = await prisma.title.count();
    console.log(
      `[seed] finished with ${finalTotal} titles (+${finalTotal - initialTotal})`,
    );
  }
}

main()
  .catch((error) => {
    console.error("Catalog seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
