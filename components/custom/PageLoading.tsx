import { LoaderCircle } from "lucide-react";

export default function PageLoading() {
  return (
    <section aria-busy="true" aria-label="Loading page" className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <p role="status" className="flex items-center gap-2 text-sm text-white/60"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading page…</p>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-28 rounded-2xl border border-white/10 bg-white/5" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-56 rounded-2xl border border-white/10 bg-white/5" />)}
        </div>
      </div>
    </section>
  );
}
