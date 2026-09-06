"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

type UploadProfilePostMediaResult =
  | {
      ok: true;
      media: {
        type: "IMAGE" | "VIDEO";
        url: string;
        publicId: string;
        width: number;
        height: number;
      };
    }
  | {
      ok: false;
      error: string;
    };

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function uploadProfilePostMedia(
  formData: FormData,
): Promise<UploadProfilePostMediaResult> {
  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return { ok: false, error: "File is required" };
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return { ok: false, error: "Only images and videos are allowed" };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { ok: false, error: "File is too large" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
      width: number;
      height: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER || "listiq"}/profile-posts`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Upload failed"));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            width: result.width,
            height: result.height,
          });
        },
      );

      stream.end(buffer);
    });

    return {
      ok: true,
      media: {
        type: result.resource_type === "video" ? "VIDEO" : "IMAGE",
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
