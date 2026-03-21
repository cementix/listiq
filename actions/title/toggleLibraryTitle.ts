"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { ActionResult } from "./types";
import { revalidatePath } from "next/cache";

export async function toggleLibraryTitle(
  titleId: string,
): Promise<ActionResult> {
  try {
    const { user, session } = await requireUserServer();

    const title = await prisma.title.findUnique({
      where: { id: titleId },
      select: { id: true, slug: true },
    });

    if (!title) return { ok: false, error: "Title not found" };

    const existing = await prisma.userTitle.findUnique({
      where: {
        userId_titleId: {
          userId: session.userId,
          titleId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.userTitle.delete({
        where: {
          userId_titleId: {
            userId: session.userId,
            titleId,
          },
        },
      });
    } else {
      await prisma.userTitle.create({
        data: {
          userId: session.userId,
          titleId,
        },
      });
    }

    revalidatePath(`/titles/${title.slug}`);
    revalidatePath("/library");

    return { ok: true };
  } catch (error) {
    console.error("toggleLibraryTitle error: ", error);
    return { ok: false, error: "Failed to toggle title" };
  }
}
