"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { UpdateUserTitleInput } from "./types";
import { Prisma } from "@/generated/prisma/client";
import { normalizeString } from "./normalizeString";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../types";

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

    if (data.rating !== undefined && data.rating !== null) {
      const isValidHalfStep = data.rating * 2 === Math.round(data.rating * 2);

      if (data.rating < 1 || data.rating > 10 || !isValidHalfStep) {
        return { ok: false, error: "Rating must be from 1 to 10 in 0.5 steps" };
      }
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

    if (data.rating !== undefined && data.rating !== existing.rating) {
      await prisma.activityEvent.create({
        data: {
          userId: session.userId,
          titleId: data.titleId,
          type: "TITLE_RATED",
          rating: data.rating,
        },
      });
    }

    if (data.note !== undefined) {
      const nextNote = data.note ? normalizeString(data.note) : null;

      if (nextNote !== existing.note) {
        await prisma.activityEvent.create({
          data: {
            userId: session.userId,
            titleId: data.titleId,
            type: "TITLE_REVIEWED",
            note: nextNote,
          },
        });
      }
    }

    revalidatePath(`/titles/${existing.title.slug}`);
    revalidatePath("/library");
    revalidatePath(`/users/${session.username}`);

    return { ok: true, message: "Updated" };
  } catch (error) {
    console.error("updateUserTitle error: ", error);
    return { ok: false, error: "Failed to update user title" };
  }
}
