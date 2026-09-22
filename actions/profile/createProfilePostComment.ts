"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { normalizeString } from "../title/normalizeString";
import type { ActionResult } from "../types";
import { revalidatePath } from "next/cache";

type CreateProfilePostCommentInput = {
  postId: string;
  content: string;
  parentId?: string | null;
};

export async function createProfilePostComment({
  postId,
  content,
  parentId,
}: CreateProfilePostCommentInput): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const normalizedContent = normalizeString(content);
    const normalizedParentId = normalizeString(parentId);

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

    const parentComment = normalizedParentId
      ? await prisma.profilePostComment.findFirst({
          where: {
            id: normalizedParentId,
            postId,
          },
          select: {
            id: true,
            authorId: true,
          },
        })
      : null;

    if (normalizedParentId && !parentComment) {
      return { ok: false, error: "Parent comment not found" };
    }

    await prisma.$transaction(async (tx) => {
      const comment = await tx.profilePostComment.create({
        data: {
          postId,
          authorId: session.userId,
          parentId: normalizedParentId,
          content: normalizedContent,
        },
      });

      const recipientId = parentComment?.authorId ?? post.authorId;
      const notificationType = parentComment
        ? "PROFILE_POST_REPLY"
        : "PROFILE_POST_COMMENT";

      if (recipientId !== session.userId) {
        await tx.notification.create({
          data: {
            recipientId,
            actorId: session.userId,
            type: notificationType,
            postId,
            commentId: comment.id,
          },
        });
      }
    });

    revalidatePath(`/users/${post.author.username}`);

    return { ok: true, message: "Comment posted" };
  } catch (error) {
    console.error("createProfilePostComment error: ", error);
    return { ok: false, error: "Failed to post comment" };
  }
}
