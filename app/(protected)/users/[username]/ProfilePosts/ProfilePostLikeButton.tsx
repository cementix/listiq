"use client";

import { toggleProfilePostLike } from "@/actions/profile/toggleProfilePostLike";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type ProfilePostLikeButtonProps = {
  postId: string;
  likesCount: number;
  isLiked: boolean;
};

export default function ProfilePostLikeButton({
  postId,
  likesCount,
  isLiked,
}: ProfilePostLikeButtonProps) {
  const [liked, setLiked] = useState(isLiked);
  const [count, setCount] = useState(likesCount);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const nextLiked = !liked;

    setLiked(nextLiked);
    setCount((current) => current + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleProfilePostLike({ postId });

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
      className={`h-auto gap-1.5 px-0 py-0 transition hover:bg-transparent ${
        liked
          ? "text-rose-300 hover:text-rose-200"
          : "text-white/45 hover:text-white"
      }`}
    >
      <Heart
        className={`size-4 transition duration-200 ${
          liked ? "scale-110" : "scale-100"
        }`}
        color={liked ? "#fb7185" : "rgba(255,255,255,0.45)"}
        fill={liked ? "#fb7185" : "none"}
      />
      {count}
    </Button>
  );
}
