"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { normalizeString } from "../title/normalizeString";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";

type CreateProfilePostInput = {
  content: string;
  attachedUserTitleId?: string | null;
};

export async function createProfilePost(
  data: CreateProfilePostInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const content = normalizeString(data.content);

    const attachedUserTitleId = normalizeString(data.attachedUserTitleId);

    if (!content && !attachedUserTitleId) {
      return { ok: false, error: "Post cannot be empty" };
    }

    if (content && content.length > 1000) {
      return { ok: false, error: "Post is too long" };
    }

    if (attachedUserTitleId) {
      const attachedUserTitle = await prisma.userTitle.findFirst({
        where: {
          id: attachedUserTitleId,
          userId: session.userId,
        },
        select: { id: true },
      });

      if (!attachedUserTitle) {
        return { ok: false, error: "Review not found" };
      }
    }

    await prisma.profilePost.create({
      data: {
        authorId: session.userId,
        content,
        attachedUserTitleId,
      },
    });

    revalidatePath(`/users/${session.username}`);

    return { ok: true, message: "Post published" };
  } catch (error) {
    console.error("createProfilePost error: ", error);
    return { ok: false, error: "Failed to publish post" };
  }
}
