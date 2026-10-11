import "server-only";

import type { Prisma } from "@/generated/prisma/client";

export async function addListTitle(
  tx: Prisma.TransactionClient,
  userId: string,
  listId: string,
  titleId: string,
) {
  // Serialize appends to a list before reading its last position.
  await tx.$queryRaw`
    SELECT id FROM "TitleList"
    WHERE id = ${listId} AND "userId" = ${userId}
    FOR UPDATE
  `;

  const list = await tx.titleList.findFirst({
    where: { id: listId, userId },
    select: { id: true, slug: true },
  });
  if (!list) return { status: "list-not-found" as const };

  const title = await tx.title.findUnique({
    where: { id: titleId },
    select: { slug: true },
  });
  if (!title) return { status: "title-not-found" as const };

  const lastItem = await tx.titleListItem.aggregate({
    where: { listId },
    _max: { position: true },
  });
  const inserted = await tx.titleListItem.createMany({
    data: { listId, titleId, position: (lastItem._max.position ?? -1) + 1 },
    skipDuplicates: true,
  });

  if (inserted.count > 0) {
    await tx.titleList.update({
      where: { id: listId },
      data: { updatedAt: new Date() },
    });
  }

  return {
    status: inserted.count > 0 ? ("added" as const) : ("already-added" as const),
    listSlug: list.slug,
    titleSlug: title.slug,
  };
}
