"use server";

import { z } from "zod";
import type { ActionResult } from "../types";
import { requireUserServer } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { addListTitle } from "@/lib/title-list/mutations";
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

    const result = await prisma.$transaction((tx) =>
      addListTitle(tx, session.userId, listId, titleId),
    );

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
