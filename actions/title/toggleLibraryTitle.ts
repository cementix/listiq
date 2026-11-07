"use server";

import { logError } from "@/lib/observability/errors";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";
import { revalidateLibraryViews } from "@/lib/cache/revalidateViews";
import type { ActionResult } from "../types";
import { addLibraryTitle, removeLibraryTitle } from "@/lib/library/mutations";

export async function toggleLibraryTitle(
  titleId: string,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const title = await prisma.$transaction(async (tx) => {
      const title = await tx.title.findUnique({
        where: { id: titleId },
        select: { id: true, slug: true },
      });

      if (!title) return null;

      const existing = await tx.userTitle.findUnique({
        where: {
          userId_titleId: {
            userId: session.userId,
            titleId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        await removeLibraryTitle(tx, session.userId, titleId);
      } else {
        await addLibraryTitle(tx, session.userId, titleId);
      }
      return title;
    });

    if (!title) return { ok: false, error: "Title not found" };

    revalidateLibraryViews(title.slug);

    return { ok: true };
  } catch (error) {
    logError("actions.title.toggleLibraryTitle", error);
    return { ok: false, error: "Failed to toggle title" };
  }
}
