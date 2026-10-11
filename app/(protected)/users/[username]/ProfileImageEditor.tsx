"use client";

import { Camera, Pencil, UserRound } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateProfileImages } from "@/actions/profile/updateProfileImages";
import CoverImageField from "@/components/custom/CoverImageField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ProfileImageEditorProps = {
  type: "avatar" | "banner";
  imageUrl: string | null;
  imagePublicId: string | null;
  largeAvatar?: boolean;
};

export default function ProfileImageEditor({
  type,
  imageUrl,
  imagePublicId,
  largeAvatar = false,
}: ProfileImageEditorProps) {
  const [open, setOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(imageUrl ?? "");
  const [currentPublicId, setCurrentPublicId] = useState(imagePublicId ?? "");
  const [draftUrl, setDraftUrl] = useState(imageUrl ?? "");
  const [draftPublicId, setDraftPublicId] = useState(imagePublicId ?? "");
  const [, startTransition] = useTransition();

  const isAvatar = type === "avatar";

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      setDraftUrl(currentUrl);
      setDraftPublicId(currentPublicId);
    }
  };

  const handleUploadComplete = (image: {
    imageUrl: string;
    imagePublicId: string;
  }) => {
    startTransition(async () => {
      const result = await updateProfileImages(
        isAvatar
          ? {
              avatarUrl: image.imageUrl,
              avatarPublicId: image.imagePublicId,
            }
          : {
              bannerUrl: image.imageUrl,
              bannerPublicId: image.imagePublicId,
            },
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setCurrentUrl(image.imageUrl);
      setCurrentPublicId(image.imagePublicId);
      setDraftUrl(image.imageUrl);
      setDraftPublicId(image.imagePublicId);
      setOpen(false);

      toast.success(result.message ?? "Profile image updated");
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {isAvatar ? (
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label="Change profile avatar"
            className={`group relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black text-white shadow-2xl ${
                largeAvatar ? "size-28 sm:size-36" : "size-24 shrink-0"
            }`}
          >
            {currentUrl ? (
              <Image
                src={currentUrl}
                alt="profile avatar"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <UserRound className="size-10 text-white/60" />
            )}

            <span className="absolute cursor-pointer inset-0 flex items-center justify-center bg-black/30 transition lg:opacity-0 lg:group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-5 text-white" />
            </span>
          </button>
        </DialogTrigger>
      ) : (
        <div className="group relative h-36 w-full overflow-hidden">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt="profile banner"
              fill
              className="object-cover rounded-md"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.35),transparent_35%),linear-gradient(135deg,rgba(15,23,42,1),rgba(0,0,0,1))]" />
          )}

          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Change profile banner"
              className="absolute right-4 cursor-pointer top-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur transition hover:bg-black/75 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Pencil className="size-4" />
            </button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent className="border-white/10 bg-black text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isAvatar ? "Change avatar" : "Change banner"}
          </DialogTitle>
        </DialogHeader>

        <CoverImageField
          imageUrl={draftUrl}
          imagePublicId={draftPublicId}
          onImageUrlChange={setDraftUrl}
          onImagePublicIdChange={setDraftPublicId}
          aspect={isAvatar ? 1 : 16 / 5}
          cropShape={isAvatar ? "round" : "rect"}
          fileName={isAvatar ? "avatar.jpg" : "banner.jpg"}
          emptyHint={isAvatar ? "square avatar crop" : "wide banner crop"}
          onImageUploadComplete={handleUploadComplete}
        />
      </DialogContent>
    </Dialog>
  );
}
