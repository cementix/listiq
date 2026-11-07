import { ExternalTitleProvider } from "@/generated/prisma/enums";
import { extractProviderSignals } from "./extractProviderSignals";
import type { CatalogSource } from "./types";

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

export function calculateCatalogScores(sources: CatalogSource[]) {
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
    } else if (source.provider === ExternalTitleProvider.MANGA_UPDATES) {
      if ((signals.ratingCount ?? 0) >= 100 && (signals.rating ?? 0) > 0) {
        strength = Math.log1p(signals.ratingCount ?? 0) * (signals.rating ?? 0) / 10;
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

  return scores;
}
