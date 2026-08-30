"use client";

import { createProfilePost } from "@/actions/profile/createProfilePost";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function ProfilePostForm() {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createProfilePost({ content });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setContent("");
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

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-white/35">{content.length}/1000</p>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !content.trim()}
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
  );
}
