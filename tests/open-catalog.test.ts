import assert from "node:assert/strict";
import { test } from "node:test";
import { mapOpenLibraryBook, mapWikidataComic } from "../lib/sync/providers/openCatalog";
import { catalogSourceLink } from "../lib/catalog/attribution";

test("replacement sources validate identifiers and never fabricate comic artwork", () => {
  const book = mapOpenLibraryBook({ key: "/works/OL123W", title: "Example", first_publish_year: 2020 });
  assert.equal(book?.imageUrl, null);
  assert.equal(mapOpenLibraryBook({ key: "https://evil.invalid", title: "Bad" }), null);
  assert.equal(mapWikidataComic("Q123", "Comic")?.imageUrl, null);
  assert.equal(mapWikidataComic("Q123", "Q123"), null);
  assert.equal(mapWikidataComic("evil", "Comic"), null);
  assert.equal(catalogSourceLink({ provider: "WIKIDATA", externalId: "Q123", externalUrl: "https://www.wikidata.org/wiki/Q123" })?.label, "Wikidata");
});
