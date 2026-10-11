import "server-only";

import {
  TitleListSystemType,
  TitleListVisibility,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { generateUniqueTitleListSlug } from "./generateUniqueTitleListSlug";

const select = {
  id: true, title: true, slug: true, visibility: true, systemType: true,
  createdAt: true, updatedAt: true,
} as const;

export async function ensureSaveForLaterList(
  userId: string,
  db: Prisma.TransactionClient = prisma,
) {
  const where = { userId_systemType: { userId, systemType: TitleListSystemType.SAVE_FOR_LATER } };
  const existing = await db.titleList.findUnique({ where, select });
  if (existing) return existing;

  // Prisma can emulate this compound-key upsert. Native ON CONFLICT via
  // createMany also stays usable inside a transaction after a competing insert.
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await generateUniqueTitleListSlug(userId, "saved for later", db);
    await db.titleList.createMany({
      data: { userId, title: "For later", slug,
        visibility: TitleListVisibility.PRIVATE,
        systemType: TitleListSystemType.SAVE_FOR_LATER },
      skipDuplicates: true,
    });
    const list = await db.titleList.findUnique({ where, select });
    if (list) return list;
    // A regular list may have claimed the generated slug; choose another.
  }
  throw new Error("Failed to create the save-for-later list");
}
