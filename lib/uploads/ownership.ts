import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { SecurityError } from "../security/errors";
import type { CreateProfilePostInput } from "../profile/postValidation";

type UploadDatabase = Pick<PrismaClient, "uploadedAsset">;
type ImageReference = { imageUrl?: string | null; imagePublicId?: string | null };

export async function ownedAsset(db: UploadDatabase, userId: string, publicId: string, purpose: "image" | "post") {
  const asset = await db.uploadedAsset.findFirst({ where: { publicId, userId, purpose } });
  if (!asset) throw new SecurityError("This upload does not belong to you");
  return asset;
}

export async function resolveOwnedPostMedia(
  db: UploadDatabase, userId: string, media: NonNullable<CreateProfilePostInput["media"]>,
) {
  if (new Set(media.map((item) => item.publicId)).size !== media.length) {
    throw new SecurityError("Duplicate media attachments");
  }
  return Promise.all(media.map(async (item) => {
    const asset = await ownedAsset(db, userId, item.publicId, "post");
    if (asset.url !== item.url || asset.type !== item.type) {
      throw new SecurityError("Invalid media reference");
    }
    return { type: asset.type, url: asset.url, publicId: asset.publicId, width: asset.width, height: asset.height };
  }));
}

export async function resolveOwnedImage(
  db: UploadDatabase, userId: string, input: ImageReference, existing?: ImageReference,
): Promise<{ imageUrl: string | null; imagePublicId: string | null }> {
  const imageUrl = input.imageUrl?.trim() || null;
  const imagePublicId = input.imagePublicId?.trim() || null;
  if (!imageUrl && !imagePublicId) return { imageUrl: null, imagePublicId: null };
  // An unchanged legacy image is allowed only from a record whose access the
  // caller has already checked. It never grants ownership of another record.
  if (existing && imageUrl === existing.imageUrl && imagePublicId === existing.imagePublicId) {
    return { imageUrl, imagePublicId };
  }
  if (!imageUrl || !imagePublicId) throw new SecurityError("Image URL and ID must be supplied together");
  const asset = await ownedAsset(db, userId, imagePublicId, "image");
  if (asset.url !== imageUrl || asset.type !== "IMAGE") {
    throw new SecurityError("Invalid image reference");
  }
  return { imageUrl: asset.url, imagePublicId: asset.publicId };
}
