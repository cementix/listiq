import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ActivityEventType } from "@/generated/prisma/enums";

// Callers own the transaction so Discover can save its choice atomically too.
export async function addLibraryTitle(
  tx: Prisma.TransactionClient,
  userId: string,
  titleId: string,
) {
  const inserted = await tx.userTitle.createMany({
    data: { userId, titleId },
    skipDuplicates: true,
  });

  if (inserted.count > 0) {
    await tx.activityEvent.create({
      data: { userId, titleId, type: ActivityEventType.TITLE_ADDED },
    });
  }

  return inserted.count > 0;
}

export async function removeLibraryTitle(
  tx: Prisma.TransactionClient,
  userId: string,
  titleId: string,
) {
  const deleted = await tx.userTitle.deleteMany({ where: { userId, titleId } });

  if (deleted.count > 0) {
    await tx.activityEvent.create({
      data: { userId, titleId, type: ActivityEventType.TITLE_REMOVED },
    });
  }

  return deleted.count > 0;
}

export async function updateLibraryTitle(
  tx: Prisma.TransactionClient,
  userId: string,
  titleId: string,
  changes: { rating?: number | null; note?: string | null },
) {
  const existing = await tx.userTitle.findUnique({
    where: { userId_titleId: { userId, titleId } },
    select: { rating: true, note: true, title: { select: { slug: true } } },
  });

  if (!existing) return null;

  const note =
    changes.note === undefined ? undefined : changes.note?.trim() || null;
  await tx.userTitle.update({
    where: { userId_titleId: { userId, titleId } },
    data: { rating: changes.rating, note },
  });

  if (changes.rating !== undefined && changes.rating !== existing.rating) {
    await tx.activityEvent.create({
      data: {
        userId,
        titleId,
        type: ActivityEventType.TITLE_RATED,
        rating: changes.rating,
      },
    });
  }

  if (note !== undefined && note !== existing.note) {
    await tx.activityEvent.create({
      data: {
        userId,
        titleId,
        type: ActivityEventType.TITLE_REVIEWED,
        note,
      },
    });
  }

  return { titleSlug: existing.title.slug };
}
