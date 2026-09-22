"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import type { ActionResult } from "../types";
import { revalidatePath } from "next/cache";

type ToggleProfilePostCommentLikeInput = {
  commentId: string;
};

export async function toggleProfilePostCommentLike({
  commentId,
}: ToggleProfilePostCommentLikeInput): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const comment = await prisma.profilePostComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        post: {
          select: {
            id: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return { ok: false, error: "Comment not found" };
    }

    const existingLike = await prisma.profilePostCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: session.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingLike) {
      await prisma.$transaction([
        prisma.profilePostCommentLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.notification.deleteMany({
          where: {
            actorId: session.userId,
            recipientId: comment.authorId,
            commentId,
            type: "PROFILE_POST_COMMENT_LIKE",
          },
        }),
      ]);

      revalidatePath(`/users/${comment.post.author.username}`);
      return { ok: true, message: "Comment unliked" };
    }

    await prisma.$transaction([
      prisma.profilePostCommentLike.create({
        data: {
          commentId,
          userId: session.userId,
        },
      }),
      ...(comment.authorId === session.userId
        ? []
        : [
            prisma.notification.create({
              data: {
                recipientId: comment.authorId,
                actorId: session.userId,
                type: "PROFILE_POST_COMMENT_LIKE",
                postId: comment.post.id,
                commentId,
              },
            }),
          ]),
    ]);

    revalidatePath(`/users/${comment.post.author.username}`);
    return { ok: true, message: "Comment liked" };
  } catch (error) {
    console.error("toggleProfilePostCommentLike error: ", error);
    return { ok: false, error: "Failed to update comment like" };
  }
}
