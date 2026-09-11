import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { syncTmdbDailyCatalog } from "@/lib/sync/providers/tmdb";

async function main() {
  const result = await syncTmdbDailyCatalog();

  console.log(result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
