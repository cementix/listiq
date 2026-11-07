import assert from "node:assert/strict";
import { test } from "node:test";
import { mapMangaUpdatesSeries, type MangaUpdatesSeries } from "../lib/sync/providers/mangaUpdates";
import { calculateCatalogScores } from "../lib/catalog/scoring";
import { catalogSourceLink } from "../lib/catalog/attribution";

const record: MangaUpdatesSeries = {
  series_id: 51239621230, title: "Berserk", type: "Manga", year: "1989",
  url: "https://www.mangaupdates.com/series/njeqwry/berserk",
  image: { url: { original: "https://cdn.mangaupdates.com/image/i501230.png" } },
  bayesian_rating: 8.98, rating_votes: 3731, genres: [{ genre: "Action" }, { genre: "Action" }],
};

test("MangaUpdates maps manga/manhwa and rejects unsupported types and unsafe links", () => {
  assert.equal(mapMangaUpdatesSeries(record)?.type, "MANGA");
  assert.equal(mapMangaUpdatesSeries({ ...record, type: "Manhwa" })?.type, "MANHWA");
  assert.equal(mapMangaUpdatesSeries(record)?.genres.length, 1);
  assert.equal(mapMangaUpdatesSeries(record)?.imageUrl, null);
  assert.equal(mapMangaUpdatesSeries({ ...record, description: "Publisher text" })?.description, null);
  for (const change of [
    { type: "Doujinshi" }, { series_id: Infinity }, { url: "https://mangaupdates.com.evil.invalid" },
  ]) assert.equal(mapMangaUpdatesSeries({ ...record, ...change }), null);
  assert.equal(catalogSourceLink({ provider: "MANGA_UPDATES", externalId: String(record.series_id), externalUrl: record.url })?.href, record.url);
});

test("MangaUpdates eligibility uses real votes and requires a cover", () => {
  const source = {
    id: "source", titleId: "title", provider: "MANGA_UPDATES" as const, rawData: record,
    sourcePopularity: null, sourceRating: null, sourceRatingCount: null,
    title: { type: "MANGA" as const, imageUrl: record.image!.url!.original!, catalogScore: null, catalogEligible: false },
  };
  assert.equal(calculateCatalogScores([source]).get("title"), 100);
  assert.equal(calculateCatalogScores([{ ...source, rawData: { ...record, rating_votes: 99 } }]).size, 0);
  assert.equal(calculateCatalogScores([{ ...source, title: { ...source.title, imageUrl: null } }]).size, 0);
});
