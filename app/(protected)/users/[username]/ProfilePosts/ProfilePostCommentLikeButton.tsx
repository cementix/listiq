"use client";

import { toggleProfilePostCommentLike } from "@/actions/profile/toggleProfilePostCommentLike";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type ProfilePostCommentLikeButtonProps = {
  commentId: string;
  likesCount: number;
  isLiked: boolean;
};

export default function ProfilePostCommentLikeButton({
  commentId,
  likesCount,
  isLiked,
}: ProfilePostCommentLikeButtonProps) {
  const [liked, setLiked] = useState(isLiked);
  const [count, setCount] = useState(likesCount);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const nextLiked = !isLiked;

    setLiked(nextLiked);
    setCount((current) => current + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleProfilePostCommentLike({ commentId });

      if (!result.ok) {
        setLiked(!nextLiked);
        setCount((current) => current + (nextLiked ? -1 : 1));
        toast.error(result.error);
      }
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={`h-auto gap-1 px-0 py-0 text-[11px] transition hover:bg-transparent ${
        liked
          ? "text-rose-300 hover:text-rose-200"
          : "text-white/30 hover:text-white/55"
      }`}
    >
      <Heart
        className={`size-3.5 transition duration-200 ${
          liked ? "scale-110" : "scale-100"
        }`}
        color={liked ? "#fb7185" : "rgba(255,255,255,0.30)"}
        fill={liked ? "#fb7185" : "none"}
      />
      {count}
    </Button>
  );
}
