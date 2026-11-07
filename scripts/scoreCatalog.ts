
import { logError } from "@/lib/observability/errors";
import "dotenv/config";

import { scoreCatalog } from "@/lib/catalog/scoreCatalog";
import { prisma } from "@/lib/prisma";

scoreCatalog()
  .then((result) => {
    console.log("Catalog scoring finished:", result);
  })
  .catch((error) => {
    logError("scripts.scoreCatalog", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
