"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

type UploadResult =
  | {
      ok: true;
      imageUrl: string;
      imagePublicId: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return { ok: false, error: "file is required" };
    }

    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "invalid file type" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "listiq",
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("upload failed"));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      stream.end(buffer);
    });

    return {
      ok: true,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "upload failed",
    };
  }
}
