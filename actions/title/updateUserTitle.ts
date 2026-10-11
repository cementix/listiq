"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";
import { UpdateUserTitleInput } from "./types";
import { updateLibraryTitle } from "@/lib/library/mutations";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../types";

export async function updateUserTitle(
  data: UpdateUserTitleInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    if (data.rating !== undefined && data.rating !== null) {
      const isValidHalfStep = data.rating * 2 === Math.round(data.rating * 2);

      if (data.rating < 1 || data.rating > 10 || !isValidHalfStep) {
        return { ok: false, error: "Rating must be from 1 to 10 in 0.5 steps" };
      }
    }

    const result = await prisma.$transaction((tx) =>
      updateLibraryTitle(tx, session.userId, data.titleId, {
        rating: data.rating,
        note: data.note,
      }),
    );

    if (!result) {
      return { ok: false, error: "Add title to library first" };
    }

    revalidatePath(`/titles/${result.titleSlug}`);
    revalidatePath("/titles");
    revalidatePath("/dashboard");
    revalidatePath("/library");
    revalidatePath(`/users/${session.username}`);

    return { ok: true, message: "Updated" };
  } catch (error) {
    console.error("updateUserTitle error: ", error);
    return { ok: false, error: "Failed to update user title" };
  }
}
