"use server";

import { prisma } from "@/lib/prisma";
import { canViewProfilePost } from "@/lib/privacy/canViewProfilePost";
import { requireUserServer } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

type ToggleProfilePostLikeInput = {
  postId: string;
};

export async function toggleProfilePostLike({
  postId,
}: ToggleProfilePostLikeInput) {
  try {
    const { session } = await requireUserServer();

    const post = await prisma.profilePost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        attachedUserTitleId: true,
        author: {
          select: {
            username: true,
            postsPublic: true,
            reviewsPublic: true,
          },
        },
      },
    });

    if (!post || !canViewProfilePost(post, session.userId)) {
      return { ok: false, error: "Post not found" };
    }

    const existingLike = await prisma.profilePostLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingLike) {
      await prisma.profilePostLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      revalidatePath(`/users/${post.author.username}`);

      return { ok: true, message: "Post unliked" };
    }

    await prisma.profilePostLike.create({
      data: {
        postId,
        userId: session.userId,
      },
    });

    revalidatePath(`/users/${post.author.username}`);

    return { ok: true, message: "Post liked" };
  } catch (error) {
    console.error("toggleProfilePostLike error: ", error);
    return { ok: false, error: "Failed to update like" };
  }
}
