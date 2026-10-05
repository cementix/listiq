"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";
import type { ActionResult } from "../types";

type UpdateProfileImagesInput = {
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  bannerUrl?: string | null;
  bannerPublicId?: string | null;
};

type ProfileImagesUpdateData = {
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  bannerUrl?: string | null;
  bannerPublicId?: string | null;
};

const normalizeImageValue = (value: string | null) => value || null;

export async function updateProfileImages(
  data: UpdateProfileImagesInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const updateData: ProfileImagesUpdateData = {};

    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = normalizeImageValue(data.avatarUrl);
    }

    if (data.avatarPublicId !== undefined) {
      updateData.avatarPublicId = normalizeImageValue(data.avatarPublicId);
    }

    if (data.bannerUrl !== undefined) {
      updateData.bannerUrl = normalizeImageValue(data.bannerUrl);
    }

    if (data.bannerPublicId !== undefined) {
      updateData.bannerPublicId = normalizeImageValue(data.bannerPublicId);
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    revalidatePath(`/users/${session.username}`);

    return { ok: true, message: "Profile images updated" };
  } catch (error) {
    console.error("updateProfileImages error: ", error);
    return { ok: false, error: "Failed to update profile images" };
  }
}
