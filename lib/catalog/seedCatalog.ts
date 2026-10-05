import { ExternalTitleProvider } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { extractProviderSignals } from "./extractProviderSignals";
import { syncAniListSeedCatalog } from "@/lib/sync/providers/anilist";
import { syncRawgSeedCatalog } from "@/lib/sync/providers/rawg";
import {
  syncTmdbPopular,
  syncTmdbTopRated,
  syncTmdbTrending,
} from "@/lib/sync/providers/tmdb";

import {
  syncAniListDailyCatalog,
  syncAniListDeepCatalog,
} from "@/lib/sync/providers/anilist";
import {
  syncRawgDailyCatalog,
  syncRawgDeepCatalog,
} from "@/lib/sync/providers/rawg";
import {
  syncTmdbDailyCatalog,
  syncTmdbDeepCatalog,
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

export type SeedProvider =
  | "tmdb"
  | "rawg"
  | "anilist"
  | "google-books"
  | "comic-vine";

export type SeedMode = "curated" | "broad";

const scoredProviders = [
  ExternalTitleProvider.TMDB_MOVIE,
  ExternalTitleProvider.TMDB_TV,
  ExternalTitleProvider.RAWG,
  ExternalTitleProvider.ANILIST,
  ExternalTitleProvider.GOOGLE_BOOKS,
  ExternalTitleProvider.COMIC_VINE,
];

const featuredComicPublishers = new Set([
  "Marvel",
  "DC Comics",
  "Image",
  "Dark Horse Comics",
  "IDW Publishing",
  "Boom! Studios",
  "Dynamite Entertainment",
  "Oni Press",
  "Titan Comics",
]);

function comicMetadata(rawData: unknown) {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    return { publisher: null, issueCount: 0 };
  }

  const data = rawData as Record<string, unknown>;
  const publisher = data.publisher;
  const issueCount = data.count_of_issues;

  if (!publisher || typeof publisher !== "object" || Array.isArray(publisher)) {
    return { publisher: null, issueCount: 0 };
  }

  const name = (publisher as Record<string, unknown>).name;
  return {
    publisher: typeof name === "string" ? name : null,
    issueCount:
      typeof issueCount === "number" && Number.isFinite(issueCount)
        ? Math.max(0, Math.trunc(issueCount))
        : 0,
  };
}

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

export async function scoreCatalog() {
  const sources = await prisma.externalTitle.findMany({
    where: { provider: { in: scoredProviders } },
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

  const groups = new Map<string, { titleId: string; strength: number }[]>();

  for (const source of sources) {
    const signals = extractProviderSignals(source.provider, source.rawData);

    let strength: number | null = null;

    if (
      source.provider === ExternalTitleProvider.TMDB_MOVIE ||
      source.provider === ExternalTitleProvider.TMDB_TV
    ) {
      if ((signals.ratingCount ?? 0) >= 150) {
        strength =
          0.8 * Math.log1p(signals.ratingCount ?? 0) +
          0.2 * Math.log1p(signals.popularity ?? 0);
      }
    } else if (source.provider === ExternalTitleProvider.ANILIST) {
      if ((signals.popularity ?? 0) >= 1000) {
        strength = Math.log1p(signals.popularity ?? 0);
      }
    } else if (source.provider === ExternalTitleProvider.RAWG) {
      if ((signals.ratingCount ?? 0) >= 100) {
        strength =
          0.55 * Math.log1p(signals.popularity ?? 0) +
          0.45 * Math.log1p(signals.ratingCount ?? 0);
      }
    } else if (source.provider === ExternalTitleProvider.GOOGLE_BOOKS) {
      if ((signals.ratingCount ?? 0) >= 1) {
        strength = Math.log1p(signals.ratingCount ?? 0);
      }
    } else if (source.provider === ExternalTitleProvider.COMIC_VINE) {
      // Issue count is not popularity; keep the pool narrow until we have votes.
      const { publisher, issueCount } = comicMetadata(source.rawData);

      if (
        issueCount >= 5 &&
        featuredComicPublishers.has(publisher ?? "")
      ) {
        strength = Math.log1p(issueCount);
      }
    }

    if (!source.title.imageUrl || strength === null) continue;

    const key = `${source.provider}:${source.title.type}`;
    const group = groups.get(key) ?? [];

    group.push({ titleId: source.titleId, strength });
    groups.set(key, group);
  }

  const scores = new Map<string, number>();

  // Compare titles within the same provider and type.
  for (const group of groups.values()) {
    group.sort((a, b) => a.strength - b.strength);

    group.forEach((entry, index) => {
      const score = Math.round(20 + (80 * (index + 1)) / group.length);

      scores.set(
        entry.titleId,
        Math.max(scores.get(entry.titleId) ?? 0, score),
      );
    });
  }

  await inBatches(sources, "source metrics", async (source) => {
    const signals = extractProviderSignals(source.provider, source.rawData);

    if (
      source.sourcePopularity === signals.popularity &&
      source.sourceRating === signals.rating &&
      source.sourceRatingCount === signals.ratingCount
    ) {
      return;
    }

    await prisma.externalTitle.update({
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

    await prisma.title.update({
      where: { id: titleId },
      data: {
        catalogScore: score ?? null,
        catalogEligible: score !== undefined,
        catalogScoredAt: new Date(),
      },
    });
  });

  return {
    sources: sources.length,
    eligibleTitles: scores.size,
  };
}

export async function seedCatalog(
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

  setSyncProgress("catalog", "scoring");
  console.log("[catalog] scoring imported titles");
  const scoring = await scoreCatalog();

  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.error),
      `Catalog seed failed for: ${failures.map((failure) => failure.provider).join(", ")}. Completed providers remain saved.`,
    );
  }

  return {
    titlesCreated: results.reduce(
      (sum, result) => sum + result.titlesCreated,
      0,
    ),
    titlesUpdated: results.reduce(
      (sum, result) => sum + result.titlesUpdated,
      0,
    ),
    providers: results,
    scoring,
  };
}
