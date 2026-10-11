"use server";

import { revalidateListViews } from "@/lib/cache/revalidateViews";
import { z } from "zod";

import { requireUserServer } from "@/lib/auth/guards";
import type { ActionResult } from "@/actions/types";
import { TitleListVisibility } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  listId: z.string().min(1),
  saved: z.boolean(),
});

export async function setTitleListSaved(
  input: z.infer<typeof schema>,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return { ok: false, error: "Invalid list bookmark" };
    }

    const { listId, saved } = parsed.data;
    const list = await prisma.titleList.findUnique({
      where: { id: listId },
      select: {
        userId: true,
        visibility: true,
      },
    });

    if (saved) {
      if (!list || list.visibility !== TitleListVisibility.PUBLIC) {
        return { ok: false, error: "List is not public" };
      }
      if (list.userId === session.userId) {
        return { ok: false, error: "You already own this list" };
      }

      await prisma.savedTitleList.upsert({
        where: { userId_listId: { userId: session.userId, listId } },
        create: { userId: session.userId, listId },
        update: {},
      });
    } else {
      await prisma.savedTitleList.deleteMany({
        where: { userId: session.userId, listId },
      });
    }

    revalidateListViews();

    return {
      ok: true,
      message: saved ? "List saved" : "List removed from saved",
    };
  } catch (error) {
    console.error("setTitleListSaved error:", error);
    return { ok: false, error: "Failed to update saved list" };
  }
}
