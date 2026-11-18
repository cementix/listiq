import { LoaderCircle } from "lucide-react";

function Skeleton({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden border border-white/10 bg-white/[0.04] ${className}`}>
      <span className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent motion-safe:animate-shimmer" />
    </div>
  );
}

export default function PageLoading() {
  return (
    <section aria-busy="true" aria-label="Loading page" className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <p role="status" className="flex items-center gap-2 text-sm text-white/50"><LoaderCircle aria-hidden="true" className="size-4 animate-spin text-violet-300" />Loading…</p>
      <div aria-hidden="true" className="space-y-6">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="aspect-[2/3] rounded-2xl" />)}
        </div>
      </div>
    </section>
  );
}
