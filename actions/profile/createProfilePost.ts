"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { normalizeString } from "../title/normalizeString";
import { ActionResult } from "../types";
import { revalidatePath } from "next/cache";

type CreateProfilePostInput = {
  content: string;
};

export async function createProfilePost(
  data: CreateProfilePostInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const content = normalizeString(data.content);

    if (!content) {
      return { ok: false, error: "Post cannot be empty" };
    }

    if (content.length > 1000) {
      return { ok: false, error: "Post is too long" };
    }

    await prisma.profilePost.create({
      data: {
        authorId: session.userId,
        content,
      },
    });

    revalidatePath(`/users/${session.username}`);

    return { ok: true, message: "Post published" };
  } catch (error) {
    console.error("createProfilePost error: ", error);
    return { ok: false, error: "Failed to publish post" };
  }
}
