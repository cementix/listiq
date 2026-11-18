"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, Clapperboard, Compass, Gamepad2, GripVertical, Heart, Library, ListOrdered, Lock, MessageSquareQuote, ShieldCheck, Sparkles, Star, Tv, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import type { LandingPoster } from "@/lib/landing/getLandingData";
import { cn } from "@/lib/utils";
import { TYPE_LABEL } from "./Hero";
import { EASE, Reveal, SectionHeading, Spotlight } from "./primitives";

function useTick(ms: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return tick;
}

function Cell({ className, icon, title, description, children, delay = 0 }: {
  className?: string; icon: ReactNode; title: string; description: string; children: ReactNode; delay?: number;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <Spotlight className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.015] transition duration-500 hover:border-white/20">
        <div className="relative flex-1 overflow-hidden">{children}</div>
        <div className="border-t border-white/5 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-violet-300 ring-1 ring-white/10">{icon}</span>
            {title}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{description}</p>
        </div>
      </Spotlight>
    </Reveal>
  );
}

const FILTERS: { label: string; icon: typeof Sparkles; types: string[] | null }[] = [
  { label: "All", icon: Sparkles, types: null },
  { label: "Movies", icon: Clapperboard, types: ["MOVIE"] },
  { label: "Series", icon: Tv, types: ["SERIES", "ANIME"] },
  { label: "Games", icon: Gamepad2, types: ["GAME"] },
  { label: "Books", icon: BookOpen, types: ["BOOK", "NOVEL", "MANGA", "MANHWA", "COMIC"] },
];

function LibraryDemo({ posters }: { posters: LandingPoster[] }) {
  const tick = useTick(1800);
  // Only offer filters the catalog can actually fill, so the demo never lies.
  const filters = FILTERS.filter((filter) => !filter.types || posters.filter((poster) => filter.types!.includes(poster.type)).length >= 2);
  const active = tick % filters.length;
  const types = filters[active].types;
  const visible = (types ? posters.filter((poster) => types.includes(poster.type)) : posters).slice(0, 4);
  const ratings = [9.5, 8.5, 9, 7.5];

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-2">
        {filters.map(({ label, icon: Icon }, index) => (
          <span key={label} className={cn("relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors duration-500", index === active ? "text-black" : "text-white/55 ring-1 ring-white/10")}>
            {index === active && <motion.span layoutId="library-filter" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
            <Icon className="relative size-3.5" /> <span className="relative">{label}</span>
          </span>
        ))}
      </div>
      <div className="mt-5 space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((poster, index) => (
            <motion.div
              layout
              key={`${poster.id}-${active}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.5, delay: index * 0.06, ease: EASE }}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-2.5"
            >
              <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10">
                <Image src={poster.imageUrl} alt="" fill sizes="36px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{poster.name}</p>
                <p className="text-[11px] text-white/40">{TYPE_LABEL[poster.type]}{poster.year ? ` · ${poster.year}` : ""}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-200">
                <Star className="size-3 fill-current" /> {ratings[index]}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const SWIPE = {
  enter: { scale: 0.94, y: 10, opacity: 0 },
  center: { scale: 1, y: 0, opacity: 1, rotate: 0, x: 0 },
  exit: (dir: number) => ({ x: dir * 220, rotate: dir * 18, opacity: 0, transition: { duration: 0.55, ease: EASE } }),
};

function DiscoverDemo({ posters }: { posters: LandingPoster[] }) {
  const tick = useTick(2000);
  const deck = posters.slice(4, 14);
  if (!deck.length) return null;
  const current = tick % deck.length;
  const direction = tick % 3 === 0 ? -1 : 1;

  return (
    <div className="relative grid h-72 place-items-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(139,92,246,0.18),transparent_60%)]" />
      {[2, 1].map((depth) => {
        const poster = deck[(current + depth) % deck.length];
        return (
          <div key={depth} className="absolute h-56 w-40 overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.06})`, opacity: 1 - depth * 0.3 }}>
            <Image src={poster.imageUrl} alt="" fill sizes="160px" className="object-cover" />
          </div>
        );
      })}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={SWIPE}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4 }}
          className="absolute h-56 w-40 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20"
        >
          <Image src={deck[current].imageUrl} alt="" fill sizes="160px" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-10">
            <p className="truncate text-xs font-semibold text-white">{deck[current].name}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-3 flex gap-3">
        <span className={cn("grid size-9 place-items-center rounded-full ring-1 ring-white/15 transition", direction < 0 ? "bg-rose-500/20 text-rose-300" : "bg-white/5 text-white/40")}><X className="size-4" /></span>
        <span className={cn("grid size-9 place-items-center rounded-full ring-1 ring-white/15 transition", direction > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-white/40")}><Heart className="size-4" /></span>
      </div>
    </div>
  );
}

function ListDemo({ posters }: { posters: LandingPoster[] }) {
  const tick = useTick(1700);
  const items = posters.slice(14, 18);
  const order = [...items.keys()];
  // Move one item to a new spot each tick to mimic drag-and-drop.
  const from = tick % items.length;
  const [moved] = order.splice(from, 1);
  order.splice((from + 2) % items.length, 0, moved);

  return (
    <div className="space-y-2 p-6">
      {order.map((itemIndex, position) => {
        const poster = items[itemIndex];
        if (!poster) return null;
        return (
          <motion.div layout key={poster.id} transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className={cn("flex items-center gap-3 rounded-xl border bg-black/30 p-2", itemIndex === moved ? "border-violet-400/40 shadow-[0_0_30px_-8px_rgba(167,139,250,0.6)]" : "border-white/5")}>
            <GripVertical className="size-4 text-white/25" />
            <span className="w-4 text-xs font-semibold text-white/40">{position + 1}</span>
            <div className="relative h-9 w-7 overflow-hidden rounded ring-1 ring-white/10">
              <Image src={poster.imageUrl} alt="" fill sizes="28px" className="object-cover" />
            </div>
            <p className="truncate text-sm text-white/85">{poster.name}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

const REVIEW = "Stayed with me for days. The ending earns every minute before it.";

function ReviewDemo() {
  const tick = useTick(55);
  const length = Math.min(REVIEW.length, tick % (REVIEW.length + 40));
  const stars = Math.min(9, Math.floor(length / 6));
  return (
    <div className="p-6">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, index) => (
            <Star key={index} className={cn("size-4 transition-all duration-300", index < stars ? "fill-violet-400 text-violet-400" : "text-white/15")} />
          ))}
        </div>
        <p className="mt-3 min-h-16 text-sm leading-relaxed text-white/80">
          {REVIEW.slice(0, length)}
          <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-violet-300" />
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-white/35">
          <span>@you · just now</span>
          <span className="font-semibold text-violet-300">{stars ? `${stars}.0/10` : "—"}</span>
        </div>
      </div>
    </div>
  );
}

const PRIVACY = ["Library", "Reviews", "Stats", "Activity"];

function PrivacyDemo() {
  const tick = useTick(1200);
  return (
    <div className="space-y-2.5 p-6">
      {PRIVACY.map((label, index) => {
        const on = ((tick + index) % 5) < 3;
        return (
          <div key={label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3.5 py-2.5 text-sm">
            <span className="text-white/75">{label}</span>
            <span className={cn("flex h-5 w-9 items-center rounded-full p-0.5 transition-colors duration-500", on ? "bg-violet-500" : "bg-white/15")}>
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={cn("size-4 rounded-full bg-white shadow", on && "ml-auto")} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

const STAGES = ["Submitted", "In review", "Approved"];

function ModerationDemo() {
  const tick = useTick(1400);
  const stage = tick % (STAGES.length + 1);
  return (
    <div className="flex h-full flex-col justify-center gap-5 p-6">
      <div className="relative flex items-center justify-between">
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <motion.div className="absolute left-4 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-violet-400 to-emerald-400" animate={{ width: `calc(${Math.min(stage, 2) * 50}% - ${Math.min(stage, 2) * 16}px)` }} transition={{ duration: 0.6, ease: EASE }} />
        {STAGES.map((label, index) => (
          <div key={label} className="relative flex flex-col items-center gap-2">
            <motion.span animate={{ scale: index === stage ? 1.15 : 1 }} className={cn("grid size-8 place-items-center rounded-full text-xs font-semibold ring-1 transition-colors duration-500", index < stage ? "bg-emerald-400/20 text-emerald-200 ring-emerald-400/40" : index === stage ? "bg-violet-500/25 text-violet-100 ring-violet-400/60" : "bg-zinc-900 text-white/35 ring-white/10")}>
              {index + 1}
            </motion.span>
            <span className="text-[11px] text-white/50">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-white/40">Members propose missing titles. Moderators keep the catalog clean.</p>
    </div>
  );
}

export default function Features({ posters }: { posters: LandingPoster[] }) {
  return (
    <section id="features" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-28 sm:px-6">
      <SectionHeading
        eyebrow="Features"
        title={<>Built for people who <span className="font-display italic text-gradient">finish</span> things.</>}
        description="Not another spreadsheet. Listiq is a fast, focused home for everything you've watched, read and played — and everything you're about to."
      />
      <div className="mt-16 grid gap-4 md:grid-cols-3">
        <Cell className="md:col-span-2" icon={<Library className="size-4" />} title="One library, every medium" description="Seven media types side by side. Filter, sort and rate — your whole taste in one view.">
          <LibraryDemo posters={posters} />
        </Cell>
        <Cell delay={0.08} icon={<Compass className="size-4" />} title="Discover, one card at a time" description="A swipe-style deck that learns from what you keep and skip.">
          <DiscoverDemo posters={posters} />
        </Cell>
        <Cell delay={0.04} icon={<ListOrdered className="size-4" />} title="Lists you can rearrange" description="Drag to reorder, share publicly or keep them private.">
          <ListDemo posters={posters} />
        </Cell>
        <Cell delay={0.1} icon={<MessageSquareQuote className="size-4" />} title="Ratings & reviews" description="Half-star precision on a 10-point scale, plus notes worth rereading.">
          <ReviewDemo />
        </Cell>
        <Cell delay={0.16} icon={<Lock className="size-4" />} title="Private by default" description="Choose exactly what others see — library, reviews, stats, activity.">
          <PrivacyDemo />
        </Cell>
        <Cell className="md:col-span-3" delay={0.05} icon={<ShieldCheck className="size-4" />} title="A catalog that keeps itself fresh" description="Daily syncs from TMDB, RAWG, MangaUpdates, Wikidata and more — plus community submissions with moderation.">
          <ModerationDemo />
        </Cell>
      </div>
    </section>
  );
}
