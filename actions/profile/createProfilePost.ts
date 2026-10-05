"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";
import { normalizeString } from "../title/normalizeString";
import type { ActionResult } from "../types";
import { revalidatePath } from "next/cache";

type ProfilePostMediaInput = {
  type: "IMAGE" | "VIDEO";
  url: string;
  publicId?: string | null;
  width: number;
  height: number;
};

type CreateProfilePostInput = {
  content: string;
  attachedUserTitleId?: string | null;
  media?: ProfilePostMediaInput[];
};

export async function createProfilePost(
  data: CreateProfilePostInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const content = normalizeString(data.content);

    const attachedUserTitleId = normalizeString(data.attachedUserTitleId);

    const media = data.media ?? [];

    if (!content && !attachedUserTitleId && media.length === 0) {
      return { ok: false, error: "Post cannot be empty" };
    }

    if (media.length > 10) {
      return { ok: false, error: "You can attach up to 10 media files" };
    }

    if (!content && !attachedUserTitleId && media.length === 0) {
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
        media: {
          create: media.map((item) => ({
            type: item.type,
            url: item.url,
            publicId: item.publicId,
            width: item.width,
            height: item.height,
          })),
        },
      },
    });

    revalidatePath(`/users/${session.username}`);

    return { ok: true, message: "Post published" };
  } catch (error) {
    console.error("createProfilePost error: ", error);
    return { ok: false, error: "Failed to publish post" };
  }
}
