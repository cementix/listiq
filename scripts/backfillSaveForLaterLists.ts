import "dotenv/config";

import { backfillSaveForLaterLists } from "@/lib/title-list/backfillSaveForLaterLists";
import { prisma } from "@/lib/prisma";

async function main() {
  const result = await backfillSaveForLaterLists();

  console.log(
    `Backfill finished: found=${result.usersFound}, created=${result.listsCreated}`,
  );
}

main()
  .catch((error) => {
    console.error("Save-for-later backfill failed: ", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect;
  });
