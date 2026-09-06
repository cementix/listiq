"use client";

import { createProfilePost } from "@/actions/profile/createProfilePost";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/lib/store/hooks";
import { LoaderCircle, Send, Star, X } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function ProfilePostForm() {
  const [content, setContent] = useState("");
  const [attachedUserTitleId, setAttachedUserTitleId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const reviewOptions = useAppSelector(
    (state) => state.profilePosts.reviewOptions,
  );

  const attachedReview = reviewOptions.find(
    (review) => review.id === attachedUserTitleId,
  );

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createProfilePost({ content, attachedUserTitleId });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setContent("");
      setAttachedUserTitleId(null);
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
            className="ml-1 shrink-0 text-white/35 transition hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {reviewOptions.slice(0, 5).map((review) => (
            <button
              key={review.id}
              type="button"
              onClick={() => setAttachedUserTitleId(review.id)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/50 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Star className="size-3.5" />
              <span className="max-w-28 truncate">{review.title.name}</span>
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-xs text-white/35">{content.length}/1000</p>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || (!content.trim() && !attachedUserTitleId)}
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
