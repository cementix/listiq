"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { Flame, Plus, Search, Star } from "lucide-react";
import { useRef } from "react";

import type { LandingPoster } from "@/lib/landing/getLandingData";
import { TYPE_LABEL } from "./Hero";
import { SectionHeading } from "./primitives";

function Rail({ title, posters }: { title: string; posters: LandingPoster[] }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-white/80 sm:text-xs"><Flame className="size-3 text-violet-300" />{title}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {posters.map((poster, index) => (
          <div key={poster.id} className={index > 3 ? "hidden sm:block" : undefined}>
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-white/10">
              <Image src={poster.imageUrl} alt="" fill sizes="120px" className="object-cover" />
            </div>
            <p className="mt-1 truncate text-[10px] text-white/60">{poster.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Showcase({ posters }: { posters: LandingPoster[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [28, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const glow = useTransform(scrollYProgress, [0, 1], [0.2, 0.8]);

  const hero = posters[0];
  const picks = posters.slice(1, 4);

  return (
    <section id="showcase" className="relative scroll-mt-24 overflow-hidden px-4 py-28 sm:px-6">
      <SectionHeading
        eyebrow="The dashboard"
        title={<>Feels like a streaming app.<br /><span className="text-white/50">Works like your memory.</span></>}
        description="A featured pick, fresh random suggestions and rails of what's popular — tuned to your library every time you open it."
      />

      <div ref={ref} role="img" aria-label="Preview of the Listiq dashboard with a featured title, random picks and rails of popular titles" className="mx-auto mt-16 max-w-5xl [perspective:1600px]">
        <motion.div style={{ rotateX, scale }} className="relative origin-top" aria-hidden="true">
          <motion.div aria-hidden style={{ opacity: glow }} className="absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgba(139,92,246,0.45),transparent)] blur-2xl" />
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-[0_40px_120px_-30px_rgba(0,0,0,1)] sm:rounded-3xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-rose-400/70" /><span className="size-2.5 rounded-full bg-amber-300/70" /><span className="size-2.5 rounded-full bg-emerald-400/70" /></div>
              <div className="mx-auto flex h-7 w-full max-w-xs items-center gap-2 rounded-full bg-white/5 px-3 text-[11px] text-white/60"><Search className="size-3" />listiq.app/dashboard</div>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              {hero && (
                <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                  <div className="relative min-h-44 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:min-h-56">
                    <Image src={hero.imageUrl} alt="" fill sizes="700px" className="scale-125 object-cover opacity-40 blur-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                    <div className="relative flex h-full items-center gap-5 p-5">
                      <div className="flex-1">
                        <p className="text-[11px] font-medium text-violet-300">Featured title</p>
                        <p className="mt-1 text-xl font-semibold text-white sm:text-3xl">{hero.name}</p>
                        <p className="mt-1 text-xs text-white/50">{TYPE_LABEL[hero.type]}{hero.year ? ` · ${hero.year}` : ""}</p>
                        <div className="mt-4 flex gap-2">
                          <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black"><Plus className="size-3" />Add to library</span>
                          <span className="hidden items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white sm:flex"><Star className="size-3" />Rate</span>
                        </div>
                      </div>
                      <div className="relative hidden aspect-[2/3] w-28 overflow-hidden rounded-xl ring-1 ring-white/20 sm:block">
                        <Image src={hero.imageUrl} alt="" fill sizes="112px" className="object-cover" />
                      </div>
                    </div>
                  </div>
                  <div className="hidden space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:block">
                    <p className="text-[11px] font-semibold text-white/80">Random picks</p>
                    {picks.map((poster) => (
                      <div key={poster.id} className="flex items-center gap-2 rounded-xl bg-black/30 p-1.5">
                        <div className="relative h-11 w-8 overflow-hidden rounded-md"><Image src={poster.imageUrl} alt="" fill sizes="32px" className="object-cover" /></div>
                        <div className="min-w-0"><p className="truncate text-[11px] font-medium text-white">{poster.name}</p><p className="text-[10px] text-white/55">{TYPE_LABEL[poster.type]}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Rail title="Popular now" posters={posters.slice(4, 10)} />
              <Rail title="Highly rated" posters={posters.slice(10, 16)} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
