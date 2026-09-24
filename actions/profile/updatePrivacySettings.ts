"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserServer } from "@/actions/auth";
import type { ActionResult } from "@/actions/types";
import { prisma } from "@/lib/prisma";

const privacySettingsSchema = z.object({
  libraryPublic: z.boolean(),
  reviewsPublic: z.boolean(),
  statsPublic: z.boolean(),
  postsPublic: z.boolean(),
  titleActivityPublic: z.boolean(),
  listActivityPublic: z.boolean(),
});

type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;

export async function updatePrivacySettings(
  input: PrivacySettingsInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const parsed = privacySettingsSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false, error: "Invalid privacy settings" };
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...parsed.data,
        privacySetupCompleted: true,
      },
    });

    revalidatePath(`/users/${session.username}`);

    return { ok: true, message: "Privacy settings updated" };
  } catch (error) {
    console.error("updatePrivacySettings error:", error);
    return { ok: false, error: "Failed to update privacy settings" };
  }
}
