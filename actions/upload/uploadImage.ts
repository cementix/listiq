"use server";

import { uploadOwnedFile } from "@/lib/uploads/upload";
import { securityErrorMessage } from "@/lib/security/errors";

type UploadResult =
  | { ok: true; imageUrl: string; imagePublicId: string }
  | { ok: false; error: string };

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  try {
    const asset = await uploadOwnedFile(formData, "image");
    return { ok: true, imageUrl: asset.url, imagePublicId: asset.publicId };
  } catch (error) {
    return { ok: false, error: securityErrorMessage(error, "Unable to upload image. Please sign in and try again.") };
  }
}
