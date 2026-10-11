"use server";

import { uploadOwnedFile } from "@/lib/uploads/upload";
import { securityErrorMessage } from "@/lib/security/errors";

type UploadProfilePostMediaResult =
  | { ok: true; media: { type: "IMAGE" | "VIDEO"; url: string; publicId: string; width: number; height: number } }
  | { ok: false; error: string };

export async function uploadProfilePostMedia(formData: FormData): Promise<UploadProfilePostMediaResult> {
  try {
    return { ok: true, media: await uploadOwnedFile(formData, "post") };
  } catch (error) {
    return { ok: false, error: securityErrorMessage(error, "Unable to upload media. Please sign in and try again.") };
  }
}
