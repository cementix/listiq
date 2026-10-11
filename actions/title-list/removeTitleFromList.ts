"use server";

import { z } from "zod";
import type { ActionResult } from "../types";
import { requireUserServer } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { revalidateLibraryViews } from "@/lib/cache/revalidateViews";

const removeTitleFromListSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  titleId: z.string().min(1, "Title ID is required"),
});

type RemoveTitleFromListInput = z.infer<typeof removeTitleFromListSchema>;

export async function removeTitleFromList(
  input: RemoveTitleFromListInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const parsed = removeTitleFromListSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data",
      };
    }

    const { listId, titleId } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const list = await tx.titleList.findFirst({
        where: {
          id: listId,
          userId: session.userId,
        },
        select: {
          id: true,
          slug: true,
        },
      });

      if (!list) {
        return { status: "list-not-found" as const };
      }

      const item = await tx.titleListItem.findUnique({
        where: {
          listId_titleId: {
            listId,
            titleId,
          },
        },
        select: {
          id: true,
          title: {
            select: {
              slug: true,
            },
          },
        },
      });

      if (!item) {
        return { status: "item-not-found" as const };
      }

      await tx.titleListItem.delete({
        where: {
          id: item.id,
        },
      });

      await tx.titleList.update({
        where: {
          id: list.id,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return {
        status: "removed" as const,
        listSlug: list.slug,
        titleSlug: item.title.slug,
      };
    });

    if (result.status === "list-not-found") {
      return { ok: false, error: "List not found" };
    }

    if (result.status === "item-not-found") {
      return {
        ok: true,
        message: "Title is not in this list",
      };
    }

    revalidateLibraryViews(result.titleSlug);

    return {
      ok: true,
      message: "Title removed from list",
    };
  } catch (error) {
    console.error("removeTitleFromList error: ", error);

    return {
      ok: false,
      error: "Failed to remove title from list",
    };
  }
}
