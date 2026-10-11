"use client";

import { useMutation } from "@/lib/hooks/use-mutation";

import { toggleProfilePostLike } from "@/actions/profile/toggleProfilePostLike";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState } from "react";
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
  const [isPending, runMutation] = useMutation();

  const handleClick = () => {
    runMutation(async () => {
      const nextLiked = !liked;
      const result = await toggleProfilePostLike({ postId });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setLiked(nextLiked);
      setCount((current) => current + (nextLiked ? 1 : -1));
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike post" : "Like post"}
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
