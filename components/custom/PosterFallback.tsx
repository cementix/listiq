import { cn } from "@/lib/utils";

/** Designed stand-in when a title has no artwork: gradient, initial and name. */
export default function PosterFallback({ name, className, showName = true }: { name: string; className?: string; showName?: boolean }) {
  return (
    <div
      role="img"
      aria-label={`${name} — no artwork`}
      className={cn("flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-500/25 via-zinc-900 to-sky-500/15 p-3 text-center", className)}
    >
      <span aria-hidden className="grid size-9 place-items-center rounded-full bg-white/10 text-base font-semibold text-white/75">
        {name.trim().slice(0, 1).toUpperCase() || "?"}
      </span>
      {showName && <span aria-hidden className="line-clamp-2 text-[11px] leading-tight text-white/50">{name}</span>}
    </div>
  );
}
