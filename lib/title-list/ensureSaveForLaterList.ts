import "server-only";

import {
  TitleListSystemType,
  TitleListVisibility,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function ensureSaveForLaterList(
  userId: string,
  db: Prisma.TransactionClient = prisma,
) {
  return db.titleList.upsert({
    where: {
      userId_systemType: {
        userId,
        systemType: TitleListSystemType.SAVE_FOR_LATER,
      },
    },
    update: {},
    create: {
      userId,
      title: "For later",
      slug: "saved-for-later",
      visibility: TitleListVisibility.PRIVATE,
      systemType: TitleListSystemType.SAVE_FOR_LATER,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      visibility: true,
      systemType: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
