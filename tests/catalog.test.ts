import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateCatalogScores } from "../lib/catalog/scoring";
import { persistCatalogScores, type CatalogDatabase } from "../lib/catalog/repository";
import type { CatalogSource } from "../lib/catalog/types";

function source(
  changes: Partial<CatalogSource> = {},
  title: Partial<CatalogSource["title"]> = {},
): CatalogSource {
  return {
    id: "source",
    titleId: "title",
    provider: "TMDB_MOVIE",
    rawData: { vote_count: 150, popularity: 10, vote_average: 8 },
    sourcePopularity: 10,
    sourceRating: 8,
    sourceRatingCount: 150,
    ...changes,
    title: {
      type: "MOVIE",
      imageUrl: "https://example.com/cover.jpg",
      catalogScore: null,
      catalogEligible: false,
      ...title,
    },
  };
}

test("catalog eligibility retains provider-specific minimum signals", () => {
  const cases = [
    { provider: "TMDB_MOVIE", rawData: { vote_count: 149 } },
    { provider: "TMDB_TV", rawData: { vote_count: 149 } },
    { provider: "ANILIST", rawData: { popularity: 999 } },
    { provider: "RAWG", rawData: { ratings_count: 99 } },
    { provider: "GOOGLE_BOOKS", rawData: { volumeInfo: { ratingsCount: 0 } } },
  ] as const;
  for (const entry of cases) {
    assert.equal(calculateCatalogScores([source(entry)]).size, 0, entry.provider);
  }
  assert.equal(calculateCatalogScores([source()]).get("title"), 100);
});

test("scores compare titles within the same provider and type", () => {
  const scores = calculateCatalogScores([
    source({ titleId: "popular", rawData: { vote_count: 1000 } }),
    source({ titleId: "less-popular", rawData: { vote_count: 150 } }),
    source({ titleId: "tv" }, { type: "SERIES" }),
    source({ titleId: "game", provider: "RAWG", rawData: { ratings_count: 100 } }, { type: "GAME" }),
  ]);
  assert.equal(scores.get("less-popular"), 60);
  assert.equal(scores.get("popular"), 100);
  assert.equal(scores.get("tv"), 100);
  assert.equal(scores.get("game"), 100);
});

test("a title keeps its strongest score across providers", () => {
  const scores = calculateCatalogScores([
    source({ titleId: "shared" }),
    source({ titleId: "other", rawData: { vote_count: 1000 } }),
    source({ titleId: "shared", provider: "ANILIST", rawData: { popularity: 1000 } }),
  ]);
  assert.equal(scores.get("shared"), 100);
});

test("missing covers and invalid provider data stay out of the catalog", () => {
  assert.equal(calculateCatalogScores([
    source({ titleId: "no-cover" }, { imageUrl: null }),
    source({ titleId: "bad-data", rawData: { vote_count: -1, popularity: Infinity } }),
    source({ titleId: "no-data", rawData: null }),
  ]).size, 0);
});

test("comics require a featured publisher and at least five issues", () => {
  const comic = (titleId: string, publisher: string, count: number) => source({
    titleId,
    provider: "COMIC_VINE",
    rawData: { publisher: { name: publisher }, count_of_issues: count },
  }, { type: "COMIC" });
  const scores = calculateCatalogScores([
    comic("eligible", "Marvel", 5),
    comic("short", "Marvel", 4),
    comic("unknown", "Unknown", 20),
  ]);
  assert.deepEqual([...scores], [["eligible", 100]]);
});

test("persistence skips unchanged source metrics and title scores", async () => {
  const db = {
    externalTitle: { update: async () => assert.fail("Unchanged source") },
    title: { update: async () => assert.fail("Unchanged title") },
  } as unknown as CatalogDatabase;
  await persistCatalogScores(db, [source({}, { catalogScore: 100, catalogEligible: true })], new Map([["title", 100]]));
});

test("persistence clears scores for titles that became ineligible", async () => {
  const writes: { where: unknown; data: Record<string, unknown> }[] = [];
  const db = {
    externalTitle: { update: async () => assert.fail("Unchanged source") },
    title: { update: async (input: typeof writes[number]) => writes.push(input) },
  } as unknown as CatalogDatabase;
  await persistCatalogScores(db, [source({}, { catalogScore: 100, catalogEligible: true })], new Map());
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].where, { id: "title" });
  assert.equal(writes[0].data.catalogScore, null);
  assert.equal(writes[0].data.catalogEligible, false);
  assert.ok(writes[0].data.catalogScoredAt instanceof Date);
});

test("persistence propagates write failures instead of reporting success", async () => {
  const db = {
    externalTitle: { update: async () => { throw new Error("Write failed"); } },
  } as unknown as CatalogDatabase;
  await assert.rejects(
    persistCatalogScores(db, [source({ sourcePopularity: null })], new Map()),
    /Write failed/,
  );
});
