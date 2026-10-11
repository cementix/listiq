import { SecurityError } from "../security/errors";

// Leaves room for multipart overhead below Vercel's request size limit.
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const MEDIA_ACCEPT = `${IMAGE_ACCEPT},video/mp4,video/webm,video/quicktime`;
export type UploadPurpose = "image" | "post";

const imageTypes = new Set(IMAGE_ACCEPT.split(","));
const videoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export function validateUploadFile(file: File, purpose: UploadPurpose) {
  if (!(file instanceof File) || file.size === 0) {
    throw new SecurityError("A non-empty file is required");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new SecurityError("File must be 3 MB or smaller");
  }
  if (!imageTypes.has(file.type) && !(purpose === "post" && videoTypes.has(file.type))) {
    throw new SecurityError("Unsupported file type");
  }
}

export function validateFileSignature(bytes: Uint8Array, mime: string) {
  const starts = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);
  const ascii = (offset: number, text: string) =>
    [...text].every((char, i) => bytes[offset + i] === char.charCodeAt(0));
  const valid = mime === "image/jpeg" ? starts(0xff, 0xd8, 0xff)
    : mime === "image/png" ? starts(137, 80, 78, 71, 13, 10, 26, 10)
    : mime === "image/gif" ? ascii(0, "GIF87a") || ascii(0, "GIF89a")
    : mime === "image/webp" ? ascii(0, "RIFF") && ascii(8, "WEBP")
    : mime === "video/webm" ? starts(0x1a, 0x45, 0xdf, 0xa3)
    : mime === "video/mp4" || mime === "video/quicktime" ? ascii(4, "ftyp")
    : false;
  if (!valid) throw new SecurityError("File content does not match its type");
}
