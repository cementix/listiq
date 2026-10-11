"use client";

import { createProfilePost } from "@/actions/profile/createProfilePost";
import { uploadProfilePostMedia } from "@/actions/profile/uploadProfilePostMedia";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/lib/store/hooks";
import { ImagePlus, LoaderCircle, Send, Star, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { MEDIA_ACCEPT, validateUploadFile } from "@/lib/uploads/policy";

const MAX_PROFILE_POST_MEDIA = 10;

export default function ProfilePostForm() {
  const [content, setContent] = useState("");
  const [attachedUserTitleId, setAttachedUserTitleId] = useState<string | null>(
    null,
  );
  const [media, setMedia] = useState<
    {
      type: "IMAGE" | "VIDEO";
      url: string;
      publicId: string;
      width: number;
      height: number;
    }[]
  >([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reviewOptions = useAppSelector(
    (state) => state.profilePosts.reviewOptions,
  );

  const attachedReview = reviewOptions.find(
    (review) => review.id === attachedUserTitleId,
  );

  const handleMediaSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const slotsLeft = MAX_PROFILE_POST_MEDIA - media.length;
    const files = selectedFiles.slice(0, slotsLeft);

    if (selectedFiles.length > slotsLeft) {
      toast.error(`You can attach up to ${MAX_PROFILE_POST_MEDIA} media files`);
    }

    if (files.length === 0) {
      event.target.value = "";
      return;
    }

    setIsUploadingMedia(true);

    try {
      const uploadedMedia: typeof media = [];

      for (const file of files) {
        try {
          validateUploadFile(file, "post");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Invalid file");
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadProfilePostMedia(formData);

        if (!result.ok) {
          toast.error(result.error);
          continue;
        }

        uploadedMedia.push(result.media);
      }

      if (uploadedMedia.length > 0) {
        setMedia((current) =>
          [...current, ...uploadedMedia].slice(0, MAX_PROFILE_POST_MEDIA),
        );
      }
    } catch {
      toast.error("Media upload failed. Please try again.");
    } finally {
      setIsUploadingMedia(false);
      event.target.value = "";
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createProfilePost({
        content,
        attachedUserTitleId,
        media,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setContent("");
      setAttachedUserTitleId(null);
      setMedia([]);
      toast.success(result.message ?? "Post published");
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write something..."
        maxLength={1000}
        className="min-h-28 border-white/10 bg-black/30 text-white placeholder:text-white/35"
      />

      {attachedReview && (
        <div className="mt-3 flex w-fit max-w-full items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-2">
          <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded-md bg-white/10">
            {attachedReview.title.imageUrl ? (
              <Image
                src={attachedReview.title.imageUrl}
                alt={attachedReview.title.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="max-w-56 truncate text-xs font-medium leading-4 text-white">
              {attachedReview.title.name}
            </p>

            <div className="mt-0.5 flex items-center gap-2">
              {attachedReview.rating !== null && (
                <span className="text-[11px] leading-4 text-primary">
                  {attachedReview.rating.toFixed(1)}/10
                </span>
              )}

              {attachedReview.note && (
                <span className="max-w-40 truncate text-[11px] leading-4 text-white/45">
                  {attachedReview.note}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAttachedUserTitleId(null)}
            aria-label="Remove attached review"
            className="ml-1 flex size-11 shrink-0 items-center justify-center text-white/35 transition hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((item) => (
            <div
              key={item.publicId}
              className="group relative max-w-full overflow-hidden rounded-xl bg-white/10"
              style={{
                width: Math.min(item.width, 520),
              }}
            >
              {item.type === "IMAGE" ? (
                <Image
                  src={item.url}
                  alt=""
                  width={item.width}
                  height={item.height}
                  className="max-h-80 w-auto max-w-full object-contain"
                  unoptimized
                />
              ) : (
                <video
                  src={item.url}
                  className="max-h-80 max-w-full object-contain"
                  muted
                />
              )}

              <button
                type="button"
                onClick={() =>
                  setMedia((current) =>
                    current.filter(
                      (mediaItem) => mediaItem.publicId !== item.publicId,
                    ),
                  )
                }
                aria-label="Remove attachment"
                className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-black/60 text-white/70 transition hover:text-white lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={MEDIA_ACCEPT}
            multiple
            className="hidden"
            onChange={handleMediaSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={
              isUploadingMedia || media.length >= MAX_PROFILE_POST_MEDIA
            }
            className="flex min-h-11 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/50 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
          >
            <ImagePlus className="size-3.5" />
            Add image/video
          </button>
          {reviewOptions.slice(0, 5).map((review) => (
            <button
              key={review.id}
              type="button"
              onClick={() => setAttachedUserTitleId(review.id)}
              className="flex min-h-11 max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/50 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Star className="size-3.5" />
              <span className="max-w-28 truncate">{review.title.name}</span>
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3">
          <p className="text-xs text-white/35">{content.length}/1000</p>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isPending ||
              isUploadingMedia ||
              (!content.trim() && !attachedUserTitleId && media.length === 0)
            }
            className="bg-white text-black hover:bg-white/90"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <>
                <Send className="size-4" />
                Post
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
