import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { syncTmdbTrending } from "@/lib/sync/providers/tmdb";

async function main() {
  const result = await syncTmdbTrending({ pages: 50 });

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
