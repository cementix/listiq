"use server";

import { logError } from "@/lib/observability/errors";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";
import type { ActionResult } from "../types";
import { resolveOwnedImage } from "@/lib/uploads/ownership";
import { securityErrorMessage } from "@/lib/security/errors";
import { profileImageSchema } from "@/lib/profile/postValidation";

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

export async function updateProfileImages(
  data: UpdateProfileImagesInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const parsed = profileImageSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: "Invalid image reference" };
    data = parsed.data;
    const existing = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { avatarUrl: true, avatarPublicId: true, bannerUrl: true, bannerPublicId: true },
    });
    const updateData: ProfileImagesUpdateData = {};
    for (const field of ["avatar", "banner"] as const) {
      const urlKey = `${field}Url` as const;
      const idKey = `${field}PublicId` as const;
      if (data[urlKey] === undefined && data[idKey] === undefined) continue;
      if (data[urlKey] === undefined || data[idKey] === undefined) {
        return { ok: false, error: "Image URL and ID must be supplied together" };
      }
      const image = await resolveOwnedImage(prisma, session.userId,
        { imageUrl: data[urlKey], imagePublicId: data[idKey] },
        { imageUrl: existing[urlKey], imagePublicId: existing[idKey] },
      );
      updateData[urlKey] = image.imageUrl;
      updateData[idKey] = image.imagePublicId;
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    revalidatePath(`/users/${session.username}`);

    return { ok: true, message: "Profile images updated" };
  } catch (error) {
    logError("actions.profile.updateProfileImages", error);
    return { ok: false, error: securityErrorMessage(error, "Failed to update profile images") };
  }
}
