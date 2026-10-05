import "dotenv/config";

import { scoreCatalog } from "@/lib/catalog/seedCatalog";
import { prisma } from "@/lib/prisma";

scoreCatalog()
  .then((result) => {
    console.log("Catalog scoring finished:", result);
  })
  .catch((error) => {
    console.error("Catalog scoring failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
