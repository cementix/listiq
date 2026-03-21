"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
    console.log("=== uploadImage start ===");

    const file = formData.get("file") as File | null;

    if (!file) {
      console.log("no file in formData");
      return { ok: false, error: "file is required" };
    }

    console.log("file:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!file.type.startsWith("image/")) {
      console.log("invalid file type:", file.type);
      return { ok: false, error: "invalid file type" };
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.log("missing CLOUDINARY_CLOUD_NAME");
      return { ok: false, error: "cloud_name missing" };
    }

    if (!process.env.CLOUDINARY_API_KEY) {
      console.log("missing CLOUDINARY_API_KEY");
      return { ok: false, error: "api_key missing" };
    }

    if (!process.env.CLOUDINARY_API_SECRET) {
      console.log("missing CLOUDINARY_API_SECRET");
      return { ok: false, error: "api_secret missing" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("buffer size:", buffer.length);

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "listiq",
        },
        (error, result) => {
          if (error) {
            console.log("cloudinary error:", error);
            reject(error);
            return;
          }

          if (!result) {
            console.log("no result from cloudinary");
            reject(new Error("no result"));
            return;
          }

          console.log("cloudinary success:", {
            url: result.secure_url,
            public_id: result.public_id,
          });

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      stream.on("error", (err) => {
        console.log("stream error:", err);
        reject(err);
      });

      stream.end(buffer);
    });

    console.log("=== uploadImage success ===");

    return {
      ok: true,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    };
  } catch (e: any) {
    console.error("=== uploadImage failed ===");
    console.error(e);

    return {
      ok: false,
      error: e?.message || "upload failed",
    };
  }
}
