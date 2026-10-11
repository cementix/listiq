"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserServer } from "@/lib/auth/guards";
import type { ActionResult } from "@/actions/types";
import { DiscoveryAction } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { ensureSaveForLaterList } from "@/lib/title-list/ensureSaveForLaterList";
import { addLibraryTitle } from "@/lib/library/mutations";
import { addListTitle } from "@/lib/title-list/mutations";

const inputSchema = z.object({
  titleId: z.string().trim().min(1),
  destination: z.enum(["for-later", "library"]),
});

export async function saveDiscoveryTitle(
  input: z.infer<typeof inputSchema>,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const parsed = inputSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false, error: "Invalid title or destination" };
    }

    const { titleId, destination } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const title = await tx.title.findUnique({
        where: { id: titleId },
        select: { slug: true },
      });

      if (!title) return null;

      let listSlug: string | null = null;

      if (destination === "for-later") {
        const list = await ensureSaveForLaterList(session.userId, tx);
        listSlug = list.slug;

        const added = await addListTitle(tx, session.userId, list.id, titleId);
        if (
          added.status === "list-not-found" ||
          added.status === "title-not-found"
        ) {
          throw new Error("Discovery destination not found");
        }
      } else {
        await addLibraryTitle(tx, session.userId, titleId);
      }

      // The choice and its actual destination succeed or fail together.
      await tx.userTitleDiscovery.upsert({
        where: {
          userId_titleId: { userId: session.userId, titleId },
        },
        create: {
          userId: session.userId,
          titleId,
          lastAction:
            destination === "for-later"
              ? DiscoveryAction.SAVED_FOR_LATER
              : DiscoveryAction.ADDED_TO_LIBRARY,
          lastActionAt: new Date(),
        },
        update: {
          lastAction:
            destination === "for-later"
              ? DiscoveryAction.SAVED_FOR_LATER
              : DiscoveryAction.ADDED_TO_LIBRARY,
          lastActionAt: new Date(),
        },
      });

      return { titleSlug: title.slug, listSlug };
    });

    if (!result) return { ok: false, error: "Title not found" };

    revalidatePath(`/titles/${result.titleSlug}`);
    revalidatePath("/my-lists");
    revalidatePath(`/users/${session.username}`);

    if (result.listSlug) {
      revalidatePath(`/lists/${session.username}/${result.listSlug}`);
    } else {
      revalidatePath("/titles");
      revalidatePath("/dashboard");
      revalidatePath("/library");
    }

    return { ok: true };
  } catch (error) {
    console.error("saveDiscoveryTitle error:", error);
    return { ok: false, error: "Failed to save title" };
  }
}
