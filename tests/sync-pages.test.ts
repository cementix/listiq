import assert from "node:assert/strict";
import { test } from "node:test";
import { syncCatalogPage } from "../lib/sync/syncPage";
import type { DailyPage } from "../lib/sync/dailyPlan";
import { prisma } from "../lib/prisma";

test("workflow page cursors reach every provider without replaying earlier pages", async () => {
  const queryRaw = prisma.$queryRaw;
  prisma.$queryRaw = (async () => [{ count: 1 }]) as typeof queryRaw;
  const original = globalThis.fetch;
  const keys = ["TMDB_ACCESS_TOKEN", "RAWG_API_KEY", "GOOGLE_BOOKS_API_KEY", "COMICVINE_API_KEY", "ANILIST_API_PERMISSION_CONFIRMED", "GOOGLE_BOOKS_CATALOG_PERMISSION_CONFIRMED", "COMIC_VINE_CATALOG_PERMISSION_CONFIRMED"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const requests: { url: URL; body?: { variables: { page: number } } }[] = [];
  for (const key of keys) process.env[key] = "unit-test-only";
  process.env.ANILIST_API_PERMISSION_CONFIRMED = "true";
  process.env.GOOGLE_BOOKS_CATALOG_PERMISSION_CONFIRMED = "true";
  process.env.COMIC_VINE_CATALOG_PERMISSION_CONFIRMED = "true";
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    requests.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (url.hostname === "graphql.anilist.co") return Response.json({ data: { Page: { media: [], pageInfo: { hasNextPage: false } } } });
    if (url.hostname.includes("comicvine")) return Response.json({ status_code: 1, results: [], offset: 0, number_of_page_results: 0, number_of_total_results: 0 });
    if (url.pathname.includes("genre")) return Response.json({ genres: [] });
    return Response.json({ results: [], items: [] });
  };
  try {
    const jobs: DailyPage[] = [
      { provider: "tmdb", section: "popular", page: 7 },
      { provider: "rawg", section: "rated", page: 5 },
      { provider: "anilist", section: "NOVEL", page: 3 },
      { provider: "google-books", section: "relevance|subject:fiction", page: 1 },
      { provider: "comic-vine", section: "updated", page: 4 },
    ];
    for (const job of jobs) await syncCatalogPage(job);
    const tmdb = requests.filter(r => r.url.pathname.endsWith("/popular"));
    assert.equal(tmdb.length, 2);
    assert.deepEqual(tmdb.map(r => r.url.searchParams.get("page")), ["7", "7"]);
    assert.equal(requests.find(r => r.url.hostname === "api.rawg.io")?.url.searchParams.get("page"), "5");
    assert.equal(requests.find(r => r.url.hostname === "graphql.anilist.co")?.body?.variables.page, 3);
    assert.equal(requests.find(r => r.url.hostname === "www.googleapis.com")?.url.searchParams.get("startIndex"), "40");
    assert.equal(requests.find(r => r.url.hostname.includes("comicvine"))?.url.searchParams.get("offset"), "400");
  } finally {
    globalThis.fetch = original;
    prisma.$queryRaw = queryRaw;
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
