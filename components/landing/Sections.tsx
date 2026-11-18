"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Compass, MousePointerClick, Star } from "lucide-react";
import { useState } from "react";

import type { LandingData } from "@/lib/landing/getLandingData";
import { cn } from "@/lib/utils";
import DemoButton from "./DemoButton";
import { CountUp, EASE, Reveal, SectionHeading, Spotlight } from "./primitives";

const SOURCES = ["TMDB", "RAWG", "MangaUpdates", "Wikidata", "AniList", "Google Books", "Open Library", "Comic Vine"];

export function StatsStrip({ stats }: { stats: LandingData["stats"] }) {
  const items = [
    { value: stats.titles, suffix: "+", label: "titles in the catalog" },
    { value: stats.mediaTypes, suffix: "", label: "kinds of media" },
    { value: SOURCES.length, suffix: "", label: "open data sources" },
    { value: 100, suffix: "%", label: "private by default" },
  ];
  return (
    <section aria-label="Listiq in numbers" className="relative border-y border-white/5 bg-white/[0.015]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        {items.map((item, index) => (
          <Reveal key={item.label} delay={index * 0.08} className="text-center">
            <CountUp value={item.value} suffix={item.suffix} className="block text-4xl font-semibold tracking-tight text-white sm:text-5xl" />
            <p className="mt-2 text-sm text-white/45">{item.label}</p>
          </Reveal>
        ))}
      </div>
      <div className="mask-fade-x pause-on-hover overflow-hidden border-t border-white/5 py-6">
        <div className="flex w-max animate-marquee-x gap-14" style={{ ["--marquee-duration" as string]: "32s" }}>
          {[...SOURCES, ...SOURCES].map((source, index) => (
            <span key={`${source}-${index}`} className="text-lg font-semibold tracking-tight whitespace-nowrap text-white/25 transition hover:text-white/70">
              {source}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: MousePointerClick, title: "Start in one click", body: "Open the live demo or create an account. Your library is ready in seconds — no setup, no import marathon." },
  { icon: Star, title: "Rate what you've finished", body: "Add titles from a catalog that syncs daily. Rate on a 10-point scale and jot down what stuck with you." },
  { icon: Compass, title: "Discover what's next", body: "Swipe through picks, save the keepers to lists and share your favourites with friends." },
];

export function Steps() {
  return (
    <section id="how-it-works" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-28 sm:px-6">
      <SectionHeading eyebrow="How it works" title="From blank slate to curated taste in minutes." />
      <div className="relative mt-16 grid gap-6 md:grid-cols-3">
        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 1.4, ease: EASE }}
          className="absolute top-8 right-[16%] left-[16%] hidden h-px origin-left bg-gradient-to-r from-violet-400/0 via-violet-400/60 to-sky-400/0 md:block"
        />
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <Reveal key={title} delay={0.15 + index * 0.15} className="relative text-center">
            <div className="relative mx-auto grid size-16 place-items-center rounded-2xl border border-white/10 bg-zinc-950 text-violet-300 shadow-[0_0_40px_-10px_rgba(139,92,246,0.6)]">
              <Icon className="size-6" />
              <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-white text-[11px] font-bold text-black">{index + 1}</span>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/55">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "Everything you need to track and share your taste.",
    features: ["Unlimited library & ratings", "Reviews and personal notes", "Public and private lists", "Discover deck", "Granular privacy controls"],
    cta: { label: "Create free account", href: "/register" },
    highlight: false,
  },
  {
    name: "Pro",
    price: "$4",
    period: "per month",
    blurb: "For collectors who want insights and zero limits.",
    features: ["Everything in Free", "Import from Letterboxd, MAL & Goodreads", "Year-in-review & advanced stats", "Smarter, unlimited recommendations", "Custom list covers & profile themes"],
    cta: { label: "Coming soon", href: null },
    highlight: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-5xl scroll-mt-24 px-4 py-28 sm:px-6">
      <SectionHeading eyebrow="Pricing" title="Free to love. Pro when you want more." description="Start free with no credit card. Pro is on the way for power users." />
      <div className="mt-16 grid gap-5 md:grid-cols-2">
        {PLANS.map((plan, index) => (
          <Reveal key={plan.name} delay={index * 0.1}>
            <Spotlight
              className={cn(
                "relative h-full overflow-hidden rounded-3xl border p-8",
                plan.highlight ? "border-violet-400/40 bg-gradient-to-b from-violet-500/[0.12] to-transparent" : "border-white/10 bg-white/[0.03]",
              )}
            >
              {plan.highlight && (
                <>
                  <div aria-hidden className="absolute -top-24 -right-24 size-64 rounded-full bg-violet-500/30 blur-3xl animate-glow" />
                  <span className="absolute top-6 right-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-[11px] font-semibold text-white">Coming soon</span>
                </>
              )}
              <p className="text-sm font-semibold text-white">{plan.name}</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight text-white">{plan.price}</span>
                <span className="text-sm text-white/45">{plan.period}</span>
              </p>
              <p className="mt-3 text-sm text-white/55">{plan.blurb}</p>
              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-white/75">
                    <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", plan.highlight ? "bg-violet-400/20 text-violet-200" : "bg-white/10 text-white/70")}>
                      <Check className="size-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.cta.href ? (
                <Link href={plan.cta.href} className="mt-8 flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(255,255,255,0.7)]">
                  {plan.cta.label}
                </Link>
              ) : (
                <span aria-disabled className="mt-8 flex h-11 cursor-not-allowed items-center justify-center rounded-full border border-white/15 text-sm font-medium text-white/60">
                  {plan.cta.label}
                </span>
              )}
            </Spotlight>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const FAQ = [
  { q: "Is Listiq free?", a: "Yes. Tracking, rating, reviews, lists and Discover are free. A Pro plan with imports and deeper stats is in development." },
  { q: "What can I track?", a: "Movies, TV series, anime, manga and manhwa, games, books, novels and comics — all in a single library." },
  { q: "Where does the catalog come from?", a: "Listiq syncs daily from open and licensed sources like TMDB, RAWG, MangaUpdates and Wikidata, with attribution on the credits page. Members can also propose missing titles for moderators to review." },
  { q: "How does the live demo work?", a: "One click creates a private sandbox account with a pre-filled library and lists. Play with everything — it's deleted after 24 hours or when you sign out." },
  { q: "Who can see my profile?", a: "Nobody, unless you choose otherwise. Library, reviews, stats, posts and activity each have their own visibility switch." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative mx-auto max-w-3xl scroll-mt-24 px-4 py-28 sm:px-6">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." />
      <div className="mt-12 divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/[0.02]">
        {FAQ.map((item, index) => {
          const isOpen = open === index;
          return (
            <Reveal key={item.q} delay={index * 0.05}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-base font-medium text-white transition hover:text-violet-200"
              >
                {item.q}
                <ChevronDown className={cn("size-5 shrink-0 text-white/40 transition-transform duration-300", isOpen && "rotate-180 text-violet-300")} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-sm leading-relaxed text-white/60">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative px-4 pt-10 pb-28 sm:px-6">
      <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 px-6 py-20 text-center sm:px-16">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.35),transparent_60%)]" />
        <div aria-hidden className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
        <div aria-hidden className="absolute -bottom-32 left-1/2 h-64 w-[700px] -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl animate-glow" />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Your next favorite is <span className="font-display italic text-gradient">already in here.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/60">Jump into a fully loaded sandbox in one click, or start your own library from scratch.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-start">
            <DemoButton />
            <Link href="/register" className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/10">
              Create free account
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer({ year }: { year: number }) {
  return (
    <footer className="border-t border-white/10 px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold text-white">
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-400 via-fuchsia-400 to-sky-400 text-[13px] font-bold text-black">l</span>
            listiq
          </p>
          <p className="mt-3 max-w-xs text-sm text-white/45">Track what you watch, read and play.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm">
          <a href="#features" className="text-white/55 transition hover:text-white">Features</a>
          <Link href="/login" className="text-white/55 transition hover:text-white">Sign in</Link>
          <a href="#pricing" className="text-white/55 transition hover:text-white">Pricing</a>
          <Link href="/register" className="text-white/55 transition hover:text-white">Create account</Link>
          <a href="#faq" className="text-white/55 transition hover:text-white">FAQ</a>
          <Link href="/credits" className="text-white/55 transition hover:text-white">Data credits</Link>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-white/5 pt-6 text-xs text-white/35 sm:flex-row sm:justify-between">
        <p>© {year} Listiq</p>
        <p>Catalog data from TMDB, RAWG, MangaUpdates, Wikidata and others. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>
    </footer>
  );
}
