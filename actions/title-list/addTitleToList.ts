"use server";

import { z } from "zod";
import type { ActionResult } from "../types";
import { requireUserServer } from "../auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const addTitleToListSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  titleId: z.string().min(1, "Title ID is required"),
});

type AddTitleToListInput = z.infer<typeof addTitleToListSchema>;

export async function addTitleToList(
  input: AddTitleToListInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const parsed = addTitleToListSchema.safeParse(input);

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

      const title = await tx.title.findUnique({
        where: {
          id: titleId,
        },
        select: {
          id: true,
          slug: true,
        },
      });

      if (!title) {
        return { status: "title-not-found" as const };
      }

      const existingItem = await tx.titleListItem.findUnique({
        where: {
          listId_titleId: {
            listId,
            titleId,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingItem) {
        return { status: "already-added" as const };
      }

      const lastItem = await tx.titleListItem.aggregate({
        where: {
          listId,
        },
        _max: {
          position: true,
        },
      });

      await tx.titleListItem.create({
        data: {
          listId,
          titleId,
          position: (lastItem._max.position ?? -1) + 1,
        },
      });

      await tx.titleList.update({
        where: {
          id: listId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return {
        status: "added" as const,
        listSlug: list.slug,
        titleSlug: title.slug,
      };
    });

    if (result.status === "list-not-found") {
      return { ok: false, error: "List not found" };
    }

    if (result.status === "title-not-found") {
      return { ok: false, error: "Title not found" };
    }

    if (result.status === "already-added") {
      return { ok: true, message: "Title is already in this list" };
    }

    revalidatePath("/my-lists");
    revalidatePath(`/my-lists/${result.listSlug}`);
    revalidatePath("/lists");
    revalidatePath(`/lists/${session.username}/${result.listSlug}`);
    revalidatePath(`/titles/${result.titleSlug}`);
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: "Title added to list",
    };
  } catch (error) {
    console.error("addTitleToList error:", error);

    return {
      ok: false,
      error: "Failed to add title to list",
    };
  }
}
