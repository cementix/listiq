"use server";

import { logError } from "@/lib/observability/errors";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserServer } from "@/lib/auth/guards";
import { isGuestUser } from "@/lib/demo/guest";
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

    if (await isGuestUser(session.userId) && Object.values(parsed.data).some(Boolean)) {
      return { ok: false, error: "Demo profiles stay private. Create a free account to share yours." };
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...parsed.data,
        privacySetupCompleted: true,
      },
    });

    revalidatePath("/", "layout");

    return { ok: true, message: "Privacy settings updated" };
  } catch (error) {
    logError("actions.profile.updatePrivacySettings", error);
    return { ok: false, error: "Failed to update privacy settings" };
  }
}
