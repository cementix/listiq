import {
  TitleListSystemType,
  TitleListVisibility,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function backfillSaveForLaterLists() {
  return prisma.$transaction(
    async (tx) => {
      const users = await tx.user.findMany({
        where: {
          titleLists: {
            none: {
              systemType: TitleListSystemType.SAVE_FOR_LATER,
            },
          },
        },
        select: {
          id: true,
          titleLists: {
            select: {
              slug: true,
            },
          },
        },
      });

      if (users.length === 0) {
        return {
          usersFound: 0,
          listsCreated: 0,
        };
      }

      const lists = users.map((user) => {
        const usedSlugs = new Set(user.titleLists.map((list) => list.slug));

        let slug = "saved-for-later";
        let suffix = 2;

        while (usedSlugs.has(slug)) {
          slug = `saved-for-later-${suffix}`;
          suffix += 1;
        }

        return {
          userId: user.id,
          title: "For later",
          slug,
          visibility: TitleListVisibility.PRIVATE,
          systemType: TitleListSystemType.SAVE_FOR_LATER,
        };
      });

      const result = await tx.titleList.createMany({
        data: lists,
        skipDuplicates: true,
      });

      return {
        usersFound: users.length,
        listsCreated: result.count,
      };
    },
    { timeout: 30_000 },
  );
}
