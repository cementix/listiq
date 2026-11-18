"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Check, ListPlus, Star } from "lucide-react";
import { useEffect, useState, type PointerEvent } from "react";

import type { LandingPoster } from "@/lib/landing/getLandingData";
import DemoButton from "./DemoButton";
import { EASE } from "./primitives";

const WORDS = ["watch", "read", "play", "binge", "love"];

export const TYPE_LABEL: Record<string, string> = {
  MOVIE: "Movie", SERIES: "Series", ANIME: "Anime", MANGA: "Manga", MANHWA: "Manhwa",
  BOOK: "Book", GAME: "Game", NOVEL: "Novel", COMIC: "Comic", OTHER: "Title",
};

function WordRotator() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIndex((value) => (value + 1) % WORDS.length), 2200);
    return () => window.clearInterval(id);
  }, []);

  // A slot-machine column: every word is laid out, the window shows one line at a time.
  return (
    <span className="relative inline-block h-[1.12em] overflow-hidden align-bottom">
      <span className="sr-only">{WORDS[index]}</span>
      <motion.span
        aria-hidden
        className="flex flex-col"
        animate={{ y: `${-index * 1.12}em` }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {WORDS.map((word, wordIndex) => (
          <motion.span
            key={word}
            animate={{ opacity: wordIndex === index ? 1 : 0.15 }}
            transition={{ duration: 0.5 }}
            className="block h-[1.12em] pr-3 font-display leading-[1.12em] italic text-gradient"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </span>
  );
}

function PosterColumn({ posters, reverse, duration }: { posters: LandingPoster[]; reverse?: boolean; duration: number }) {
  const loop = [...posters, ...posters];
  return (
    <div className="overflow-hidden">
      <div
        className={reverse ? "animate-marquee-down" : "animate-marquee-up"}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {loop.map((poster, index) => (
          <div
            key={`${poster.id}-${index}`}
            className="relative mb-4 aspect-[2/3] w-full overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]"
          >
            <Image src={poster.imageUrl} alt="" fill sizes="(min-width: 1024px) 160px, 30vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PosterWall({ posters }: { posters: LandingPoster[] }) {
  const columns = Array.from({ length: 5 }, (_, column) =>
    posters.filter((_, index) => index % 5 === column),
  ).map((column, index) => (column.length >= 3 ? column : posters.slice(index, index + 6)));
  const durations = [46, 38, 52, 42, 58];

  return (
    <div className="grid h-full grid-cols-5 gap-4">
      {columns.map((column, index) => (
        <PosterColumn key={index} posters={column} reverse={index % 2 === 1} duration={durations[index]} />
      ))}
    </div>
  );
}

function FloatingCard({ className, delay, children }: { className: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={`absolute z-20 hidden xl:block ${className}`}
    >
      <div className="animate-float rounded-2xl border border-white/15 bg-zinc-950/70 p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl" style={{ animationDelay: `${delay}s` }}>
        {children}
      </div>
    </motion.div>
  );
}

function RatingStars() {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    let value = 0;
    const id = window.setInterval(() => {
      value = value >= 9 ? 0 : value + 1;
      setFilled(value);
    }, 260);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 10 }, (_, index) => (
        <Star
          key={index}
          className={`size-3 transition-all duration-200 ${index < filled ? "scale-110 fill-violet-400 text-violet-400" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

export default function Hero({ posters }: { posters: LandingPoster[] }) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 60, damping: 20 });
  const springY = useSpring(pointerY, { stiffness: 60, damping: 20 });
  const wallX = useTransform(springX, [-1, 1], [-18, 18]);
  const wallY = useTransform(springY, [-1, 1], [-12, 12]);

  const onMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const [first, second, third] = posters;

  return (
    <section onPointerMove={onMove} className="noise relative isolate min-h-[100svh] overflow-hidden">
      {/* Ambient light */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.35),transparent)] animate-glow" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.18),transparent)]" />
        <div className="absolute bottom-0 -left-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(closest-side,rgba(232,121,249,0.16),transparent)]" />
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_70%)]" />
      </div>

      {/* Poster wall */}
      <motion.div
        aria-hidden
        style={{ x: wallX, y: wallY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.2 }}
        className="pointer-events-none absolute inset-y-0 right-[-30%] -z-10 w-[130%] opacity-[0.16] [mask-image:linear-gradient(to_right,transparent,#000_35%)] sm:right-[-12%] sm:w-[90%] lg:right-[-6%] lg:w-[60%] lg:opacity-90"
      >
        <div className="mask-fade-y h-[140%] -translate-y-[12%] [transform:perspective(1400px)_rotateX(14deg)_rotateY(-18deg)_rotateZ(8deg)]">
          <PosterWall posters={posters} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
      </motion.div>

      <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-4 pt-28 pb-20 sm:px-6">
        <div className="max-w-2xl text-center sm:text-left">
          <motion.a
            href="#features"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-3 pl-1 text-xs text-white/70 backdrop-blur-md transition hover:border-white/20 hover:text-white"
          >
            <span className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
            One library for 7 kinds of stories
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </motion.a>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: EASE }}
            className="mt-7 text-5xl leading-[1.02] font-semibold tracking-[-0.04em] text-white sm:text-7xl lg:text-[5.5rem]"
          >
            Everything you <br />
            <WordRotator /> <br />
            <span className="text-white/90">in one library.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/65 sm:mx-0 sm:text-lg"
          >
            Movies, series, anime, manga, games, books and comics — tracked, rated and
            organised in one beautiful place. Build lists, write reviews and let Listiq
            surface what to start next.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:items-start"
          >
            <DemoButton />
            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-medium text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
            >
              Create free account
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-4 text-xs text-white/55"
          >
            No signup needed · private sandbox · resets in 24 hours
          </motion.p>
        </div>
      </div>

      {first && (
        <FloatingCard className="right-[16%] top-[19%]" delay={1}>
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-10 overflow-hidden rounded-lg ring-1 ring-white/10">
              <Image src={first.imageUrl} alt="" fill sizes="40px" className="object-cover" />
            </div>
            <div>
              <p className="max-w-40 truncate text-sm font-medium text-white">{first.name}</p>
              <p className="mb-1.5 text-[11px] text-white/55">{TYPE_LABEL[first.type]} · rating…</p>
              <RatingStars />
            </div>
          </div>
        </FloatingCard>
      )}
      {second && (
        <FloatingCard className="right-[3%] top-[47%]" delay={1.3}>
          <div className="flex items-center gap-2.5 pr-1 text-sm">
            <span className="grid size-7 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="size-4" /></span>
            <span className="text-white/80">Added <b className="font-medium text-white">{second.name}</b></span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60">Weekend queue</span>
          </div>
        </FloatingCard>
      )}
      {third && (
        <FloatingCard className="right-[19%] bottom-[15%]" delay={1.6}>
          <div className="flex items-center gap-2.5 text-sm">
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500 text-xs font-semibold text-white">N</span>
            <div>
              <p className="text-white/80"><b className="font-medium text-white">nova</b> saved your list</p>
              <p className="flex items-center gap-1 text-[11px] text-white/55"><ListPlus className="size-3" /> All-time favorites · 2m ago</p>
            </div>
          </div>
        </FloatingCard>
      )}

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block"
      >
        <div className="flex h-9 w-5 justify-center rounded-full border border-white/20 pt-1.5">
          <motion.span
            animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="block h-1.5 w-1 rounded-full bg-white/60"
          />
        </div>
      </motion.div>
    </section>
  );
}
