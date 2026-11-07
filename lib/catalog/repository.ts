import type { PrismaClient } from "@/generated/prisma/client";
import { ExternalTitleProvider } from "@/generated/prisma/enums";
import { extractProviderSignals } from "./extractProviderSignals";
import { setSyncProgress } from "@/lib/sync/syncUtils";
import type { TitleType } from "@/generated/prisma/enums";
import type { CatalogSource } from "./types";

export type CatalogDatabase = Pick<PrismaClient, "externalTitle" | "title">;

const scoredProviders = [
  ExternalTitleProvider.MANGA_UPDATES,
  ExternalTitleProvider.TMDB_MOVIE,
  ExternalTitleProvider.TMDB_TV,
  ExternalTitleProvider.RAWG,
  ExternalTitleProvider.ANILIST,
  ExternalTitleProvider.GOOGLE_BOOKS,
  ExternalTitleProvider.COMIC_VINE,
];

async function inBatches<T>(
  items: T[],
  label: string,
  task: (item: T) => Promise<unknown>,
) {
  for (let start = 0; start < items.length; start += 20) {
    await Promise.all(items.slice(start, start + 20).map(task));
    setSyncProgress(
      "catalog:scoring",
      `${label} ${Math.min(start + 20, items.length)}/${items.length}`,
    );
  }
}

export async function readCatalogSources(
  db: CatalogDatabase,
  type?: TitleType,
): Promise<CatalogSource[]> {
  const sources = await db.externalTitle.findMany({
    where: { provider: { in: scoredProviders }, ...(type ? { title: { type } } : {}) },
    select: {
      id: true,
      titleId: true,
      provider: true,
      rawData: true,
      sourcePopularity: true,
      sourceRating: true,
      sourceRatingCount: true,
      title: {
        select: {
          type: true,
          imageUrl: true,
          catalogScore: true,
          catalogEligible: true,
        },
      },
    },
  });

  return sources;
}

export async function persistCatalogScores(
  db: CatalogDatabase,
  sources: CatalogSource[],
  scores: Map<string, number>,
) {
  await inBatches(sources, "source metrics", async (source) => {
    const signals = extractProviderSignals(source.provider, source.rawData);

    if (
      source.sourcePopularity === signals.popularity &&
      source.sourceRating === signals.rating &&
      source.sourceRatingCount === signals.ratingCount
    ) {
      return;
    }

    await db.externalTitle.update({
      where: { id: source.id },
      data: {
        sourcePopularity: signals.popularity,
        sourceRating: signals.rating,
        sourceRatingCount: signals.ratingCount,
      },
    });
  });

  const titleIds = [...new Set(sources.map((source) => source.titleId))];
  const currentTitles = new Map(
    sources.map((source) => [source.titleId, source.title]),
  );

  await inBatches(titleIds, "title scores", async (titleId) => {
    const score = scores.get(titleId);
    const current = currentTitles.get(titleId);

    if (
      current?.catalogScore === (score ?? null) &&
      current.catalogEligible === (score !== undefined)
    ) {
      return;
    }

    await db.title.update({
      where: { id: titleId },
      data: {
        catalogScore: score ?? null,
        catalogEligible: score !== undefined,
        catalogScoredAt: new Date(),
      },
    });
  });
}
