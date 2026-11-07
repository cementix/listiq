import assert from "node:assert/strict";
import { test } from "node:test";
import { assertDemoTarget } from "../lib/demo/guard";
import { catalogSourceLink } from "../lib/catalog/attribution";

test("demo rejects the production target even when pooling changes the hostname", () => {
  assert.throws(() => assertDemoTarget("postgresql://u:p@ep-example.neon.tech/neondb", "postgresql://u:p@ep-example-pooler.neon.tech/neondb"));
  assert.doesNotThrow(() => assertDemoTarget("postgresql://u:p@localhost:5432/demo", "postgresql://u:p@ep-example.neon.tech/neondb"));
});

test("provider credits reject injected schemes and lookalike hosts", () => {
  assert.equal(catalogSourceLink({ provider: "RAWG", externalId: "1", externalUrl: "javascript:alert(1)" }), null);
  assert.equal(catalogSourceLink({ provider: "RAWG", externalId: "1", externalUrl: "https://rawg.io.attacker.invalid/" }), null);
  assert.equal(catalogSourceLink({ provider: "RAWG", externalId: "1", externalUrl: "https://user:secret@rawg.io/" }), null);
  assert.equal(catalogSourceLink({ provider: "GOOGLE_BOOKS", externalId: "book id", externalUrl: null })?.href, "https://books.google.com/books?id=book%20id");
});
