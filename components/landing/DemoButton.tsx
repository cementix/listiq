"use client";

import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useActionState } from "react";

import { startDemo, type DemoState } from "@/actions/demo";
import { cn } from "@/lib/utils";

export default function DemoButton({ className, label = "Try the live demo" }: { className?: string; label?: string }) {
  const [state, action, pending] = useActionState<DemoState>(startDemo, { ok: true });

  return (
    <form action={action} className={cn("flex flex-col items-center gap-2 sm:items-start", className)}>
      <button
        type="submit"
        disabled={pending}
        className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_12px_40px_-8px_rgba(167,139,250,0.8)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_18px_60px_-8px_rgba(167,139,250,1)] disabled:cursor-wait disabled:opacity-80"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-violet-300/60 to-transparent animate-shimmer" />
        {pending ? <Loader2 className="relative size-4 animate-spin" /> : <Sparkles className="relative size-4 text-violet-600" />}
        <span className="relative">{pending ? "Preparing your sandbox…" : label}</span>
        {!pending && <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-1" />}
      </button>
      {state.error ? (
        <p role="alert" className="text-xs text-rose-300">{state.error}</p>
      ) : null}
    </form>
  );
}
