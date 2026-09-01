"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { normalizeString } from "../title/normalizeString";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";

type CreateProfilePostCommentInput = {
  postId: string;
  content: string;
};

export async function createProfilePostComment({
  postId,
  content,
}: CreateProfilePostCommentInput): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const normalizedContent = normalizeString(content);

    if (!normalizedContent) {
      return { ok: false, error: "Comment cannot be empty" };
    }

    if (normalizedContent.length > 500) {
      return { ok: false, error: "Comment is too long" };
    }

    const post = await prisma.profilePost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!post) {
      return { ok: false, error: "Post not found" };
    }

    await prisma.profilePostComment.create({
      data: {
        postId,
        authorId: session.userId,
        content: normalizedContent,
      },
    });

    revalidatePath(`/users/${post.author.username}`);

    return { ok: true, message: "Comment posted" };
  } catch (error) {
    console.error("createProfilePostComment error: ", error);
    return { ok: false, error: "Failed to post comment" };
  }
}
