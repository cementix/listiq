"use server";

import { revalidateListViews } from "@/lib/cache/revalidateViews";
import { z } from "zod";

import { requireUserServer } from "@/lib/auth/guards";
import type { ActionResult } from "@/actions/types";
import { prisma } from "@/lib/prisma";
import { lockOwnedList } from "@/lib/title-list/mutations";

const updateTitleListSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  title: z
    .string()
    .trim()
    .min(1, "List title is required")
    .max(80, "List title must be 80 characters or less"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

type UpdateTitleListInput = z.infer<typeof updateTitleListSchema>;

export async function updateTitleList(
  input: UpdateTitleListInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const parsed = updateTitleListSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid list data",
      };
    }

    const { listId, title, description, visibility } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      await lockOwnedList(tx, session.userId, listId);
      const list = await tx.titleList.findFirst({
        where: {
          id: listId,
          userId: session.userId,
        },
        select: {
          id: true,
          slug: true,
          systemType: true,
        },
      });

      if (!list) {
        return { status: "not-found" as const };
      }

      if (list.systemType) {
        return { status: "system-list" as const };
      }

      await tx.titleList.update({
        where: { id: list.id },
        data: {
          title,
          description: description || null,
          visibility,
        },
      });

      return {
        status: "updated" as const,
        slug: list.slug,
      };
    });

    if (result.status === "not-found") {
      return { ok: false, error: "List not found" };
    }

    if (result.status === "system-list") {
      return { ok: false, error: "System lists cannot be customized" };
    }

    revalidateListViews();

    return { ok: true, message: "List updated" };
  } catch (error) {
    console.error("updateTitleList error:", error);
    return { ok: false, error: "Failed to update the list" };
  }
}
