"use server";

import { logError } from "@/lib/observability/errors";

import { revalidateListViews } from "@/lib/cache/revalidateViews";
import { z } from "zod";

import { requireUserServer } from "@/lib/auth/guards";
import type { ActionResult } from "@/actions/types";
import { prisma } from "@/lib/prisma";
import { lockOwnedList } from "@/lib/title-list/mutations";

const deleteTitleListSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
});

type DeleteTitleListInput = z.infer<typeof deleteTitleListSchema>;

export async function deleteTitleList(
  input: DeleteTitleListInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const parsed = deleteTitleListSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      await lockOwnedList(tx, session.userId, parsed.data.listId);
      const list = await tx.titleList.findFirst({
        where: {
          id: parsed.data.listId,
          userId: session.userId,
        },
        select: {
          id: true,
          systemType: true,
        },
      });

      if (!list) {
        return { status: "not-found" as const };
      }

      if (list.systemType) {
        return { status: "system-list" as const };
      }

      await tx.titleList.delete({
        where: {
          id: list.id,
        },
      });

      return { status: "deleted" as const };
    });

    if (result.status === "not-found") {
      return { ok: false, error: "List not found" };
    }

    if (result.status === "system-list") {
      return {
        ok: false,
        error: "System lists cannot be deleted",
      };
    }

    revalidateListViews();

    return {
      ok: true,
      message: "List deleted",
    };
  } catch (error) {
    logError("actions.title-list.deleteTitleList", error);

    return {
      ok: false,
      error: "Failed to delete list",
    };
  }
}
