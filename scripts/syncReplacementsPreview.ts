import dotenv from "dotenv";
dotenv.config({ path: ".env.preview", override: true, quiet: true });
if (!new URL(process.env.DATABASE_URL!).hostname.startsWith("ep-soft-voice-b9fa03m7-pooler.")) throw new Error("Preview target required");
const { prisma } = await import("../lib/prisma");
const { syncOpenCatalog } = await import("../lib/sync/providers/openCatalog");
try {
  for (const source of ["open-library", "wikidata"] as const) {
    try { console.log(JSON.stringify({ source, ...await syncOpenCatalog(source, 5) })); }
    catch { console.error(`${source} sample failed`); process.exitCode = 1; }
  }
} finally { await prisma.$disconnect(); }
