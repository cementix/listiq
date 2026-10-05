import "dotenv/config";
import { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

async function main() {
  const rows = await Promise.all(
    Object.values(TitleType).map(async (type) => ({
      type,
      total: await prisma.title.count({ where: { type } }),
      eligible: await prisma.title.count({
        where: { type, catalogEligible: true },
      }),
    })),
  );

  console.table(rows);
  console.log(
    "Total:",
    rows.reduce((sum, row) => sum + row.total, 0),
  );
}

main()
  .catch((error) => {
    console.error("Catalog status failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
