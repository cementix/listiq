"use server";

import { requireUserServer } from "@/actions/auth";
import type { ActionResult } from "@/actions/types";
import { prisma } from "@/lib/prisma";

export async function markDiscoveryShown(
  titleId: string,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    if (!titleId.trim()) {
      return { ok: false, error: "Title ID is required" };
    }

    const title = await prisma.title.findUnique({
      where: { id: titleId },
      select: { id: true },
    });

    if (!title) {
      return { ok: false, error: "Title not found" };
    }

    // Another impression does not erase the previous choice.
    await prisma.userTitleDiscovery.upsert({
      where: {
        userId_titleId: {
          userId: session.userId,
          titleId,
        },
      },
      create: {
        userId: session.userId,
        titleId,
        shownCount: 1,
        lastShownAt: new Date(),
      },
      update: {
        shownCount: { increment: 1 },
        lastShownAt: new Date(),
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("markDiscoveryShown error:", error);
    return { ok: false, error: "Failed to record title impression" };
  }
}
