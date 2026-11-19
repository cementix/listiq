"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCcw, Star, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { YearInReview } from "@/lib/stats/getYearInReview";

const SLIDE_MS = 6000;
const EASE = [0.22, 1, 0.36, 1] as const;

const TYPE_LABEL: Record<string, string> = {
  MOVIE: "movies", SERIES: "series", ANIME: "anime", MANGA: "manga", MANHWA: "manhwa",
  BOOK: "books", GAME: "games", NOVEL: "novels", COMIC: "comics", OTHER: "stories",
};

const PERSONA = {
  generous: { title: "The Enthusiast", body: "You find something to love in almost everything." },
  balanced: { title: "The Curator", body: "Fair, thoughtful and hard to impress — but not impossible." },
  tough: { title: "The Critic", body: "A high score from you is something titles have to earn." },
};

function Big({ children, delay = 0.15 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className="text-gradient font-display text-[5.5rem] leading-none italic sm:text-[8rem]"
    >
      {children}
    </motion.p>
  );
}

function Line({ children, delay = 0.35, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={`text-balance ${className}`}
    >
      {children}
    </motion.p>
  );
}

export default function YearStory({ data, username }: { data: YearInReview; username: string }) {
  const persona = PERSONA[data.generosity];

  const slides: { key: string; bg: string; content: ReactNode }[] = [
    {
      key: "intro",
      bg: "from-violet-700/60 via-fuchsia-700/30 to-black",
      content: (
        <>
          <Line delay={0.05} className="text-sm font-semibold tracking-[0.3em] text-white/70 uppercase">@{username} · Year in review</Line>
          <Big>{data.year}</Big>
          <Line className="mt-6 text-2xl font-semibold sm:text-3xl">You added <span className="text-gradient">{data.total}</span> {data.total === 1 ? "title" : "titles"} to your library.</Line>
          <Line delay={0.55} className="mt-3 text-white/60">Let&apos;s look back at what kept you watching, reading and playing.</Line>
        </>
      ),
    },
    ...(data.busiestMonth ? [{
      key: "month",
      bg: "from-sky-700/50 via-indigo-800/30 to-black",
      content: (
        <>
          <Line delay={0.05} className="text-lg text-white/70">Your busiest month was</Line>
          <Big>{data.busiestMonth.label}</Big>
          <Line className="mt-6 text-2xl font-semibold">{data.busiestMonth.count} {data.busiestMonth.count === 1 ? "title" : "titles"} in a single month.</Line>
          <Line delay={0.55} className="mt-3 text-white/60">Something about that month just hit different.</Line>
        </>
      ),
    }] : []),
    ...(data.topType ? [{
      key: "type",
      bg: "from-fuchsia-700/50 via-rose-800/30 to-black",
      content: (
        <>
          <Line delay={0.05} className="text-lg text-white/70">You were all about</Line>
          <Big>{TYPE_LABEL[data.topType.type] ?? "stories"}</Big>
          <Line className="mt-6 text-2xl font-semibold">{data.topType.count} of your {data.total} titles.</Line>
          <Line delay={0.55} className="mt-3 text-white/60">
            {data.typesTried > 1 ? `And you explored ${data.typesTried} different kinds of media along the way.` : "Focused. We respect that."}
          </Line>
        </>
      ),
    }] : []),
    ...(data.topGenre ? [{
      key: "genre",
      bg: "from-amber-600/40 via-orange-800/25 to-black",
      content: (
        <>
          <Line delay={0.05} className="text-lg text-white/70">One genre kept pulling you back</Line>
          <Big>{data.topGenre.name}</Big>
          <Line className="mt-6 text-2xl font-semibold">{data.topGenre.count} {data.topGenre.count === 1 ? "title" : "titles"} and counting.</Line>
        </>
      ),
    }] : []),
    ...(data.average !== null ? [{
      key: "persona",
      bg: "from-emerald-700/40 via-teal-800/25 to-black",
      content: (
        <>
          <Line delay={0.05} className="text-lg text-white/70">Your average rating</Line>
          <Big>{data.average.toFixed(1)}</Big>
          <Line className="mt-6 text-sm font-semibold tracking-[0.3em] text-white/70 uppercase">Your rating persona</Line>
          <Line delay={0.5} className="mt-2 text-3xl font-semibold sm:text-4xl">{persona.title}</Line>
          <Line delay={0.65} className="mt-3 text-white/60">{persona.body} {data.reviews > 0 ? `You also wrote ${data.reviews} ${data.reviews === 1 ? "review" : "reviews"}.` : ""}</Line>
        </>
      ),
    }] : []),
    ...(data.favourites.length ? [{
      key: "favourites",
      bg: "from-violet-800/50 via-sky-900/30 to-black",
      content: (
        <>
          <Line delay={0.05} className="text-lg text-white/70">Your top-rated of {data.year}</Line>
          <div className="mt-8 flex max-w-full items-end justify-center gap-3 sm:gap-4">
            {data.favourites.map((title, index) => (
              <motion.div
                key={title.id}
                initial={{ opacity: 0, y: 60, rotate: (index - 2) * 6 }}
                animate={{ opacity: 1, y: index === 0 ? -16 : 0, rotate: (index - 2) * 3 }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.12, ease: EASE }}
                className={`relative shrink-0 overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] ring-1 ring-white/20 ${index === 0 ? "h-48 w-32 sm:h-64 sm:w-44" : "h-36 w-24 sm:h-48 sm:w-32"} ${index > 2 ? "hidden sm:block" : ""}`}
              >
                {title.imageUrl && <Image src={title.imageUrl} alt={title.name} fill sizes="176px" className="object-cover" unoptimized />}
                <span className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold backdrop-blur">
                  <Star className="size-3 fill-violet-400 text-violet-400" />{title.rating.toFixed(1)}
                </span>
              </motion.div>
            ))}
          </div>
          <Line delay={0.9} className="mt-8 text-2xl font-semibold">{data.favourites[0].name}</Line>
          <Line delay={1} className="mt-1 text-white/60">took the crown.</Line>
        </>
      ),
    }] : []),
    {
      key: "outro",
      bg: "from-violet-700/50 via-fuchsia-800/30 to-black",
      content: (
        <>
          <Line delay={0.05} className="text-lg text-white/70">That was your {data.year}</Line>
          <Big>Here&apos;s to more.</Big>
          <Line className="mt-6 text-white/60">{data.rated} ratings · {data.reviews} reviews · {data.typesTried} kinds of media</Line>
        </>
      ),
    },
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const last = slides.length - 1;

  const go = useCallback((delta: number) => setIndex((value) => Math.min(last, Math.max(0, value + delta))), [last]);

  useEffect(() => {
    if (paused || index === last) return;
    const id = window.setTimeout(() => go(1), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, last, go]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); go(1); }
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const slide = slides[index];

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-black text-white" role="region" aria-roledescription="carousel" aria-label={`Your ${data.year} in review`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.key + "-bg"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`}
        >
          <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
          <motion.div
            aria-hidden
            animate={{ scale: [1, 1.15, 1], rotate: [0, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 left-1/2 size-[80vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.12),transparent)]"
          />
        </motion.div>
      </AnimatePresence>

      {/* Progress */}
      <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 p-4">
        {slides.map((item, slideIndex) => (
          <div key={item.key} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <motion.div
              key={`${item.key}-${index}-${paused}`}
              className="h-full rounded-full bg-white"
              initial={{ width: slideIndex < index || (slideIndex === index && index === last) ? "100%" : "0%" }}
              animate={{ width: slideIndex < index || slideIndex === index ? "100%" : "0%" }}
              transition={{ duration: slideIndex === index && index !== last ? (paused ? 1e6 : SLIDE_MS / 1000) : 0, ease: "linear" }}
            />
          </div>
        ))}
      </div>

      <Link href="/stats" aria-label="Close year in review" className="absolute top-8 right-4 z-30 grid size-10 place-items-center rounded-full bg-black/30 text-white/80 backdrop-blur transition hover:bg-black/50 hover:text-white">
        <X className="size-5" />
      </Link>

      {/* Tap zones */}
      <button type="button" aria-label="Previous" onClick={() => go(-1)} className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize focus:outline-none" />
      <button
        type="button"
        aria-label="Next"
        onClick={() => go(1)}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        className="absolute inset-y-0 right-0 z-10 w-2/3 cursor-e-resize focus:outline-none"
      />

      <AnimatePresence mode="wait">
        <motion.section
          key={slide.key}
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="pointer-events-none relative z-0 mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center"
        >
          {slide.content}
        </motion.section>
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-5">
        <button type="button" onClick={() => go(-1)} disabled={index === 0} className="grid size-11 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20 disabled:opacity-0" aria-label="Previous slide">
          <ChevronLeft className="size-5" />
        </button>
        {index === last ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setIndex(0)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-medium backdrop-blur transition hover:bg-white/20">
              <RotateCcw className="size-4" /> Replay
            </button>
            <Link href="/stats" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:-translate-y-0.5">Back to insights</Link>
          </div>
        ) : (
          <p className="text-xs text-white/60">Tap or use ← → · hold to pause</p>
        )}
        <button type="button" onClick={() => go(1)} disabled={index === last} className="grid size-11 place-items-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20 disabled:opacity-0" aria-label="Next slide">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
