"use server";

import { logError } from "@/lib/observability/errors";

import { requireUserServer } from "@/lib/auth/guards";
import type { ActionResult } from "@/actions/types";
import { DiscoveryAction } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function skipDiscoveryTitle(
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

    const now = new Date();

    await prisma.userTitleDiscovery.upsert({
      where: {
        userId_titleId: { userId: session.userId, titleId },
      },
      create: {
        userId: session.userId,
        titleId,
        skipCount: 1,
        lastAction: DiscoveryAction.SKIPPED,
        lastActionAt: now,
      },
      update: {
        skipCount: { increment: 1 },
        lastAction: DiscoveryAction.SKIPPED,
        lastActionAt: now,
      },
    });

    return { ok: true };
  } catch (error) {
    logError("actions.discovery.skipDiscoveryTitle", error);
    return { ok: false, error: "Failed to skip title" };
  }
}
