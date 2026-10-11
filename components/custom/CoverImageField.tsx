"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { uploadImage } from "@/actions/upload/uploadImage";
import { Button } from "@/components/ui/button";
import { IMAGE_ACCEPT, MAX_UPLOAD_BYTES } from "@/lib/uploads/policy";

type CoverImageFieldProps = {
  imageUrl: string;
  imagePublicId: string;
  onImageUrlChange: (value: string) => void;
  onImagePublicIdChange: (value: string) => void;
  compact?: boolean;
  aspect?: number;
  cropShape?: "rect" | "round";
  fileName?: string;
  emptyHint?: string;
  onImageUploadComplete?: (image: {
    imageUrl: string;
    imagePublicId: string;
  }) => void;
};

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedFile(
  imageSrc: string,
  crop: Area,
  fileName = "cover.jpg",
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("canvas context not available");
  }

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("failed to create cropped image"));
          return;
        }

        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}

export default function CoverImageField({
  imageUrl,
  onImageUrlChange,
  onImagePublicIdChange,
  compact = false,
  aspect = 1,
  cropShape = "rect",
  fileName = "cover.jpg",
  emptyHint = "square crop 1:1",
  onImageUploadComplete,
}: CoverImageFieldProps) {
  const [localPreview, setLocalPreview] = useState("");
  const [cropSource, setCropSource] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrl = localPreview || imageUrl;

  const resetCrop = () => {
    setCropSource("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!IMAGE_ACCEPT.split(",").includes(file.type) || file.size > MAX_UPLOAD_BYTES) {
      toast.error("Choose a JPEG, PNG, WebP or GIF up to 3 MB");
      e.target.value = "";
      return;
    }

    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }

    const localUrl = URL.createObjectURL(file);
    setCropSource(localUrl);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  };

  const handleUploadCroppedImage = async () => {
    if (!cropSource || !croppedAreaPixels) {
      toast.error("crop the image first");
      return;
    }

    setIsUploadingImage(true);

    try {
      const croppedFile = await getCroppedFile(
        cropSource,
        croppedAreaPixels,
        fileName,
      );

      const formData = new FormData();
      formData.append("file", croppedFile);

      const result = await uploadImage(formData);

      if (!result.ok) {
        toast.error(result.error || "upload failed");
        return;
      }

      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }

      onImageUrlChange(result.imageUrl);
      onImagePublicIdChange(result.imagePublicId);
      setLocalPreview(result.imageUrl);
      onImageUploadComplete?.({
        imageUrl: result.imageUrl,
        imagePublicId: result.imagePublicId,
      });
      resetCrop();

      toast.success("image uploaded");
    } catch (error) {
      console.error(error);
      toast.error("upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const clearImage = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }

    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }

    setLocalPreview("");
    onImageUrlChange("");
    onImagePublicIdChange("");
    resetCrop();
  };

  const coverHeight = compact
    ? "h-10"
    : aspect === 1
      ? "aspect-square max-w-70"
      : "aspect-[16/5]";
  const cropHeight = compact ? "h-48" : "h-[248px]";

  const isSquare = aspect === 1;
  const previewClassName = isSquare
    ? "relative mx-auto aspect-square w-full max-w-70 overflow-hidden rounded-2xl border border-white/10 bg-black/20"
    : "relative aspect-[16/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20";

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleImageSelect}
        disabled={isUploadingImage}
        className="hidden"
      />

      {!cropSource && !previewUrl && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className={
            compact
              ? `${coverHeight} flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-white/15 bg-white/5 px-3 text-sm text-white/75 disabled:cursor-not-allowed disabled:opacity-60`
              : `${coverHeight} flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center disabled:cursor-not-allowed disabled:opacity-60`
          }
        >
          <ImagePlus className={compact ? "size-4" : "size-5 text-white/75"} />
          <span className="font-medium">Select cover</span>
          {!compact && (
            <span className="mt-1 text-xs text-white/45">{emptyHint}</span>
          )}
        </button>
      )}

      {cropSource && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div
            className={`relative ${cropHeight} overflow-hidden rounded-xl bg-black`}
          >
            <Cropper
              image={cropSource}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) =>
                setCroppedAreaPixels(croppedPixels)
              }
            />
          </div>

          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full cursor-pointer"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleUploadCroppedImage}
              disabled={isUploadingImage}
              className="h-9 flex-1 bg-white text-black hover:bg-white/90"
            >
              {isUploadingImage ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                "Apply crop"
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={resetCrop}
              disabled={isUploadingImage}
              className="h-9 border-white/10 bg-transparent text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!cropSource && previewUrl && (
        <div
          className={
            compact
              ? "flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2"
              : previewClassName
          }
        >
          <div
            className={
              compact
                ? "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20"
                : "absolute inset-0"
            }
          >
            <Image
              src={previewUrl}
              alt="uploaded preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div
            className={
              compact
                ? "flex min-w-0 flex-1 gap-2"
                : "absolute inset-x-3 bottom-3 grid grid-cols-2 gap-2"
            }
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="h-9 border-white/10 bg-black/60 text-white backdrop-blur hover:bg-black/70 cursor-pointer"
            >
              Change
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearImage}
              disabled={isUploadingImage}
              className="h-9 border-white/10 bg-black/60 text-white backdrop-blur hover:bg-black/70 cursor-pointer"
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
