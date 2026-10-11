import { prisma } from "@/lib/prisma";
import { calculateCatalogScores } from "./scoring";
import { readCatalogSources, persistCatalogScores } from "./repository";

export async function scoreCatalog() {
  const sources = await readCatalogSources(prisma);
  const scores = calculateCatalogScores(sources);
  await persistCatalogScores(prisma, sources, scores);

  return { sources: sources.length, eligibleTitles: scores.size };
}
