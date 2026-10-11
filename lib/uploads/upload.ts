import "server-only";

import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";
import { limitUser } from "../security/limits";
import type { UploadPurpose } from "./policy";
import { uploadFile, type UploadDependencies } from "./service";

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials are missing");
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
}

const dependencies: UploadDependencies = {
  authenticate: async () => (await requireUserServer()).session.userId,
  consumeQuota: (userId) => limitUser("upload", userId),
  upload: (bytes, resourceType, userId, purpose) => {
    configureCloudinary();
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        public_id: `${process.env.CLOUDINARY_UPLOAD_FOLDER || "listiq"}/users/${userId}/${purpose}/${randomUUID()}`,
        resource_type: resourceType,
        overwrite: false,
        allowed_formats: resourceType === "image" ? ["jpg", "png", "webp", "gif"] : ["mp4", "webm", "mov"],
        timeout: 60000,
      }, (error, response) => {
        if (error || !response) reject(error || new Error("Cloudinary upload failed"));
        else resolve(response);
      });
      stream.on("error", reject);
      stream.end(bytes);
    });
  },
  save: (data) => prisma.uploadedAsset.create({
    data,
    select: { type: true, url: true, publicId: true, width: true, height: true },
  }),
  remove: (publicId, resourceType) => cloudinary.uploader.destroy(publicId, { resource_type: resourceType }),
};

export async function uploadOwnedFile(formData: FormData, purpose: UploadPurpose) {
  return uploadFile(dependencies, formData, purpose);
}
