"use server";

import { z } from "zod";

import type { ActionResult } from "../types";
import { requireUserServer } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { lockOwnedList } from "@/lib/title-list/mutations";
import { revalidateListViews } from "@/lib/cache/revalidateViews";

const reorderTitleListItemsSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  itemIds: z
    .array(z.string().min(1))
    .max(500, "A list cannot reorder more than 500 items at once")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Item IDs must be unique",
    }),
});

type ReorderTitleListItemsInput = z.infer<typeof reorderTitleListItemsSchema>;

export async function reorderTitleListItems(
  input: ReorderTitleListItemsInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const parsed = reorderTitleListItemsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid item order",
      };
    }

    const { listId, itemIds } = parsed.data;

    const result = await prisma.$transaction(
      async (tx) => {
        await lockOwnedList(tx, session.userId, listId);
        const list = await tx.titleList.findFirst({
          where: {
            id: listId,
            userId: session.userId,
          },
          select: {
            id: true,
            slug: true,
            items: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!list) {
          return { status: "not-found" as const };
        }

        const currentItemIds = new Set(list.items.map((item) => item.id));

        const containsEveryItem =
          itemIds.length === currentItemIds.size &&
          itemIds.every((itemId) => currentItemIds.has(itemId));

        if (!containsEveryItem) {
          return { status: "invalid-order" as const };
        }

        for (const [position, itemId] of itemIds.entries()) {
          await tx.titleListItem.update({
            where: {
              id: itemId,
            },
            data: {
              position,
            },
          });
        }

        await tx.titleList.update({
          where: {
            id: list.id,
          },
          data: {
            updatedAt: new Date(),
          },
        });

        return {
          status: "reordered" as const,
          slug: list.slug,
        };
      },
      { timeout: 30_000 },
    );

    if (result.status === "not-found") {
      return { ok: false, error: "List not found" };
    }

    if (result.status === "invalid-order") {
      return {
        ok: false,
        error: "Item order does not match the list",
      };
    }

    revalidateListViews();

    return {
      ok: true,
      message: "List order updated",
    };
  } catch (error) {
    console.error("reorderTitleListItems error:", error);

    return {
      ok: false,
      error: "Failed to reorder list",
    };
  }
}
