import { Pool } from "pg";

const TYPES = ["MOVIE", "SERIES", "ANIME", "MANGA", "MANHWA", "BOOK", "GAME", "NOVEL"] as const;

/** Deterministic fixture titles; ids and slugs are prefixed so they never collide with real data. */
export const E2E_TITLES = TYPES.flatMap((type, typeIndex) =>
  [0, 1].map((n) => {
    const index = typeIndex * 2 + n;
    return {
      id: `e2e_title_${index}`,
      slug: `e2e-${type.toLowerCase()}-${n + 1}`,
      name: `E2E ${type.charAt(0)}${type.slice(1).toLowerCase()} ${n + 1}`,
      type,
      year: 2010 + index,
      score: 90 - index,
    };
  }),
);

function assertLocalDatabase(url: string | undefined): asserts url is string {
  if (!url) throw new Error("Set DATABASE_URL to a local, migrated Postgres before running e2e tests");
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "[::1]", "db"].includes(host)) {
    throw new Error(`Refusing to seed e2e fixtures into non-local database host "${host}"`);
  }
}

export default async function globalSetup() {
  const url = process.env.DATABASE_URL;
  assertLocalDatabase(url);
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    for (const title of E2E_TITLES) {
      await pool.query(
        `INSERT INTO "Title" (id, name, slug, year, type, description, "catalogEligible", "catalogScore", "updatedAt")
         VALUES ($1, $2, $3, $4, $5::"TitleType", $6, true, $7, now())
         ON CONFLICT (slug) DO NOTHING`,
        [title.id, title.name, title.slug, title.year, title.type, `Fixture ${title.type.toLowerCase()} used by end-to-end tests.`, title.score],
      );
    }
    // Repeated local runs would otherwise trip the per-IP sign-up and demo limits.
    await pool.query(`DELETE FROM "RateLimitBucket" WHERE key LIKE 'auth:%' OR key LIKE 'demo:%'`);
  } finally {
    await pool.end();
  }
}
