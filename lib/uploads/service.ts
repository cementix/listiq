import "server-only";

import type { UploadApiResponse } from "cloudinary";
import { SecurityError } from "../security/errors";
import { MAX_UPLOAD_BYTES, validateFileSignature, validateUploadFile, type UploadPurpose } from "./policy";

type ResourceType = "image" | "video";
export type UploadedMedia = {
  type: "IMAGE" | "VIDEO";
  url: string;
  publicId: string;
  width: number;
  height: number;
};
export type UploadDependencies = {
  authenticate(): Promise<string>;
  consumeQuota(userId: string): Promise<void>;
  upload(bytes: Buffer, type: ResourceType, userId: string, purpose: UploadPurpose): Promise<UploadApiResponse>;
  save(data: UploadedMedia & { userId: string; purpose: UploadPurpose; bytes: number }): Promise<UploadedMedia>;
  remove(publicId: string, type: ResourceType): Promise<unknown>;
};

export async function uploadFile(deps: UploadDependencies, formData: FormData, purpose: UploadPurpose) {
  const userId = await deps.authenticate();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new SecurityError("File is required");
  validateUploadFile(file, purpose);
  await deps.consumeQuota(userId);
  const bytes = Buffer.from(await file.arrayBuffer());
  validateFileSignature(bytes, file.type);
  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const result = await deps.upload(bytes, resourceType, userId, purpose);

  try {
    if (result.resource_type !== resourceType ||
        !Number.isInteger(result.width) || result.width <= 0 ||
        !Number.isInteger(result.height) || result.height <= 0 ||
        result.width * result.height > 40_000_000 ||
        !Number.isInteger(result.bytes) || result.bytes <= 0 || result.bytes > MAX_UPLOAD_BYTES) {
      throw new SecurityError("Invalid media size or dimensions");
    }
    return await deps.save({
      userId, purpose, bytes: result.bytes,
      type: resourceType === "video" ? "VIDEO" : "IMAGE",
      publicId: result.public_id, url: result.secure_url,
      width: result.width, height: result.height,
    });
  } catch (error) {
    // Attempt cleanup if validation or persistence failed; keep the original error.
    try { await deps.remove(result.public_id, resourceType); }
    catch { console.error("Failed to remove an untracked Cloudinary upload"); }
    throw error;
  }
}
