import Link from "next/link";

import { PosterWall } from "@/components/landing/Hero";
import { MotionProvider } from "@/components/landing/primitives";
import { getLandingData } from "@/lib/landing/getLandingData";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { posters } = await getLandingData();

  return (
    <MotionProvider>
      <div className="relative grid min-h-dvh bg-black text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.3),transparent)] animate-glow" />
          <div className="absolute -bottom-40 left-1/4 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.14),transparent)]" />
        </div>

        <div className="relative z-10 flex flex-col px-4 py-6 sm:px-10">
          <Link href="/" className="flex w-fit items-center gap-2 text-lg font-semibold tracking-tight">
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-400 via-fuchsia-400 to-sky-400 text-[13px] font-bold text-black">l</span>
            listiq
          </Link>
          <div className="flex flex-1 items-center justify-center py-10">{children}</div>
        </div>

        <div aria-hidden className="relative hidden overflow-hidden border-l border-white/10 lg:block">
          <div className="mask-fade-y absolute inset-0 -top-24 -bottom-24 [transform:perspective(1400px)_rotateY(-10deg)_rotateZ(4deg)_scale(1.15)]">
            <PosterWall posters={posters} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-12 pt-40">
            <p className="max-w-md text-3xl leading-tight font-semibold tracking-tight">
              Every film, show, game and book you love —{" "}
              <span className="font-display italic text-gradient">in one place.</span>
            </p>
            <p className="mt-3 text-sm text-white/50">Rate it. List it. Never forget what to start next.</p>
          </div>
        </div>
      </div>
    </MotionProvider>
  );
}
