"use server";

import { logError } from "@/lib/observability/errors";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";
import { normalizeString } from "../title/normalizeString";
import type { ActionResult } from "../types";
import { revalidatePath } from "next/cache";
import { resolveOwnedPostMedia } from "@/lib/uploads/ownership";
import { limitUser } from "@/lib/security/limits";
import { securityErrorMessage } from "@/lib/security/errors";
import { postSchema, type CreateProfilePostInput } from "@/lib/profile/postValidation";

export async function createProfilePost(
  data: CreateProfilePostInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const parsed = postSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: "Invalid post content or media" };
    data = parsed.data;
    const content = normalizeString(data.content);

    const attachedUserTitleId = normalizeString(data.attachedUserTitleId);

    const media = data.media ?? [];

    if (!content && !attachedUserTitleId && media.length === 0) {
      return { ok: false, error: "Post cannot be empty" };
    }

    await limitUser("post", session.userId);
    const verifiedMedia = await resolveOwnedPostMedia(prisma, session.userId, media);

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
          create: verifiedMedia,
        },
      },
    });

    revalidatePath(`/users/${session.username}`);

    return { ok: true, message: "Post published" };
  } catch (error) {
    logError("actions.profile.createProfilePost", error);
    return { ok: false, error: securityErrorMessage(error, "Failed to publish post") };
  }
}
