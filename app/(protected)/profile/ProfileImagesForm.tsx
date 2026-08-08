"use client";

import { updateProfileImages } from "@/actions/profile/updateProfileImages";
import CoverImageField from "@/components/custom/CoverImageField";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type ProfileImagesFormProps = {
  avatarUrl: string | null;
  avatarPublicId: string | null;
  bannerUrl: string | null;
  bannerPublicId: string | null;
};

export default function ProfileImagesForm({
  avatarUrl: initialAvatarUrl,
  avatarPublicId: initialAvatarPublicId,
  bannerUrl: initialBannerUrl,
  bannerPublicId: initialBannerPublicId,
}: ProfileImagesFormProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [avatarPublicId, setAvatarPublicId] = useState(
    initialAvatarPublicId ?? "",
  );
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl ?? "");
  const [bannerPublicId, setBannerPublicId] = useState(
    initialBannerPublicId ?? "",
  );

  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProfileImages({
        avatarUrl,
        avatarPublicId,
        bannerUrl,
        bannerPublicId,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Profile images updated");
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <CoverImageField
        imageUrl={avatarUrl}
        imagePublicId={avatarPublicId}
        onImageUrlChange={setAvatarUrl}
        onImagePublicIdChange={setAvatarPublicId}
        aspect={1}
        cropShape="round"
        fileName="avatar.jpg"
        emptyHint="square avatar crop"
      />
      <CoverImageField
        imageUrl={bannerUrl}
        imagePublicId={bannerPublicId}
        onImageUrlChange={setBannerUrl}
        onImagePublicIdChange={setBannerPublicId}
        aspect={16 / 5}
        cropShape="rect"
        fileName="banner.jpg"
        emptyHint="wide banner crop"
      />

      <div className="lg:col-span-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="h-10 bg-white text-black hover:bg-white/90"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            "Save profile images"
          )}
        </Button>
      </div>
    </div>
  );
}
