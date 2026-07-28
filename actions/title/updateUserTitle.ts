"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { UpdateUserTitleInput } from "./types";
import { Prisma } from "@/generated/prisma/client";
import { normalizeString } from "./normalizeString";
import { revalidatePath } from "next/cache";
import { ActionResult } from "../types";

export async function updateUserTitle(
  data: UpdateUserTitleInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const existing = await prisma.userTitle.findUnique({
      where: {
        userId_titleId: {
          userId: session.userId,
          titleId: data.titleId,
        },
      },
      include: {
        title: {
          select: { slug: true },
        },
      },
    });

    if (!existing) {
      return { ok: false, error: "Add title to library first" };
    }

    if (
      data.rating !== undefined &&
      data.rating !== null &&
      (data.rating < 1 || data.rating > 10)
    ) {
      return { ok: false, error: "Rating must be from 1 to 10" };
    }

    const updateData: Prisma.UserTitleUpdateInput = {};

    if (data.rating !== undefined) {
      updateData.rating = data.rating;
    }

    if (data.note !== undefined) {
      const note = data.note ? normalizeString(data.note) : null;
      updateData.note = note;
    }

    await prisma.userTitle.update({
      where: {
        userId_titleId: {
          userId: session.userId,
          titleId: data.titleId,
        },
      },
      data: updateData,
    });

    revalidatePath(`/titles/${existing.title.slug}`);
    revalidatePath("/library");

    return { ok: true, message: "Updated" };
  } catch (error) {
    console.error("updateUserTitle error: ", error);
    return { ok: false, error: "Failed to update user title" };
  }
}
