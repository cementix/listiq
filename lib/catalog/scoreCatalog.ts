import { prisma } from "@/lib/prisma";
import { calculateCatalogScores } from "./scoring";
import { readCatalogSources, persistCatalogScores } from "./repository";
import type { TitleType } from "@/generated/prisma/enums";

export async function scoreCatalog(type?: TitleType) {
  const sources = await readCatalogSources(prisma, type);
  const scores = calculateCatalogScores(sources);
  await persistCatalogScores(prisma, sources, scores);

  return { sources: sources.length, eligibleTitles: scores.size };
}
