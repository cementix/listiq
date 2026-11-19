import { Sparkles } from "lucide-react";

import { exitDemo } from "@/actions/demo";

export default function DemoBanner({ hoursLeft }: { hoursLeft: number | null }) {
  return (
    <div className="relative z-30 border-b border-primary/20 bg-gradient-to-r from-primary/15 via-fuchsia-500/10 to-sky-500/15">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 text-white/80">
          <Sparkles className="size-4 shrink-0 text-primary animate-pulse" aria-hidden />
          <span>
            You&apos;re exploring a private demo sandbox
            {hoursLeft ? <span className="text-white/50"> · resets in {hoursLeft}h</span> : null}
          </span>
        </p>
        <form action={exitDemo}>
          <button
            type="submit"
            className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(255,255,255,0.6)]"
          >
            Create your free account
          </button>
        </form>
      </div>
    </div>
  );
}
