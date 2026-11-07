import "dotenv/config";
import { syncGoogleBooksCatalog } from "@/lib/sync/providers/googleBooks";
import { scoreCatalog } from "@/lib/catalog/scoreCatalog";
import { prisma } from "@/lib/prisma";

// Operator recovery: retry each curated query independently after a partial
// Google Books outage. Preserve successful imports and report partial failure.
async function main() {
  const curatedQueries = [
    "subject:fiction", "subject:fantasy", "subject:science fiction",
    "subject:mystery", "subject:comics",
  ];
  const requestedQueries = process.argv.slice(2);
  if (requestedQueries.some(query => !curatedQueries.includes(query))) {
    throw new Error("Recovery accepts only existing curated book queries");
  }
  const queries = requestedQueries.length ? requestedQueries : curatedQueries;
  const failed: string[] = [];
  for (const orderBy of ["relevance", "newest"] as const) {
    for (const query of queries) {
      const label = `${orderBy} ${query}`;
      try {
        const result = await syncGoogleBooksCatalog({
          queries: [query], orderBy, pagesPerQuery: orderBy === "relevance" ? 2 : 1,
        });
        console.log(JSON.stringify({ query: label, ...result }));
      } catch {
        failed.push(label);
        console.error(`Book query failed after provider retries: ${label}`);
      }
    }
  }
  const scoring = await scoreCatalog();
  const books = await prisma.title.count({ where: { type: "BOOK" } });
  console.log(JSON.stringify({ books, scoring, failed }));
  if (failed.length) process.exitCode = 1;
}

main().catch(() => {
  console.error("Book recovery failed; inspect provider/database connectivity");
  process.exitCode = 1;
}).finally(async () => { await prisma.$disconnect(); });
