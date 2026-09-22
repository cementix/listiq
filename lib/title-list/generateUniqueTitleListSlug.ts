import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import "server-only";
import { slugifyTitleList } from "./slugifyTitleList";

export async function generateUniqueTitleListSlug(
  userId: string,
  title: string,
  db: Prisma.TransactionClient = prisma,
) {
  const baseSlug = slugifyTitleList(title) || "list";

  const existingLists = await db.titleList.findMany({
    where: {
      userId,
      OR: [
        {
          slug: baseSlug,
        },
        {
          slug: {
            startsWith: `${baseSlug}-`,
          },
        },
      ],
    },
    select: {
      slug: true,
    },
  });

  const usedSlugs = new Set(existingLists.map((list) => list.slug));

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}
