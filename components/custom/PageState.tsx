import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default function PageState({ title, description, code, children }: {
  title: string;
  description: string;
  /** Large decorative label such as "404". */
  code?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div aria-hidden className="absolute top-1/2 left-1/2 -z-10 size-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.28),transparent)] animate-glow" />
      {code ? (
        <p aria-hidden className="text-gradient font-display text-[7rem] leading-none italic animate-in fade-in zoom-in-90 duration-700 sm:text-[10rem]">
          {code}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-white animate-in fade-in slide-in-from-bottom-2 duration-700 sm:text-4xl">{title}</h1>
      <p className="max-w-md text-sm leading-6 text-white/60 animate-in fade-in slide-in-from-bottom-2 duration-700">{description}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-700">
        {children}
        <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 px-5 hover:bg-white/10"><Link href="/">Go home</Link></Button>
      </div>
    </section>
  );
}
