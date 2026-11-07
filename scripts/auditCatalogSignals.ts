
import { logError } from "@/lib/observability/errors";
import "dotenv/config";

import { ExternalTitleProvider } from "@/generated/prisma/enums";
import { extractProviderSignals } from "@/lib/catalog/extractProviderSignals";
import { prisma } from "@/lib/prisma";

const SAMPLE_SIZE = 1000;

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((sorted.length - 1) * fraction);

  return sorted[index];
}

async function main() {
  for (const provider of Object.values(ExternalTitleProvider)) {
    const [total, sample] = await Promise.all([
      prisma.externalTitle.count({ where: { provider } }),
      prisma.externalTitle.findMany({
        where: { provider },
        orderBy: { createdAt: "desc" },
        take: SAMPLE_SIZE,
        select: {
          rawData: true,
          title: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      }),
    ]);

    const entries = sample.map((entry) => ({
      name: entry.title.name,
      type: entry.title.type,
      ...extractProviderSignals(provider, entry.rawData),
    }));

    const popularity = entries.flatMap((entry) =>
      entry.popularity === null ? [] : [entry.popularity],
    );
    const ratingCounts = entries.flatMap((entry) =>
      entry.ratingCount === null ? [] : [entry.ratingCount],
    );

    console.log(`\n${provider}: total=${total}, sampled=${sample.length}`);
    console.table({
      popularity: {
        available: popularity.length,
        p50: percentile(popularity, 0.5),
        p90: percentile(popularity, 0.9),
        p99: percentile(popularity, 0.99),
      },
      ratingCount: {
        available: ratingCounts.length,
        p50: percentile(ratingCounts, 0.5),
        p90: percentile(ratingCounts, 0.9),
        p99: percentile(ratingCounts, 0.99),
      },
    });

    console.table(
      [...entries]
        .sort(
          (a, b) =>
            (b.popularity ?? b.ratingCount ?? 0) -
            (a.popularity ?? a.ratingCount ?? 0),
        )
        .slice(0, 5)
        .map(({ name, type, popularity, ratingCount }) => ({
          name,
          type,
          popularity,
          ratingCount,
        })),
    );
  }
}

main()
  .catch((error) => {
    logError("scripts.auditCatalogSignals", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
