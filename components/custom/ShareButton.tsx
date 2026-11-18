"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Shares a public URL via the Web Share API, falling back to the clipboard. */
export default function ShareButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Public link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if ((error as Error).name !== "AbortError") toast.error("Couldn't copy the link");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-white/75 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
    >
      {copied ? <Check className="size-4 text-emerald-300" /> : <Share2 className="size-4" />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
