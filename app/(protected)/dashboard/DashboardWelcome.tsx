import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookMarked, Check, ListChecks, MessageSquareQuote, Star } from "lucide-react";

import { CountUp } from "@/components/landing/primitives";
import { prisma } from "@/lib/prisma";

async function getLibrarySummary(userId: string) {
  const [library, rated, reviews, lists, discovered, recent] = await Promise.all([
    prisma.userTitle.count({ where: { userId } }),
    prisma.userTitle.aggregate({ where: { userId, rating: { not: null } }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.userTitle.count({ where: { userId, note: { not: null } } }),
    prisma.titleList.count({ where: { userId, systemType: null } }),
    prisma.userTitleDiscovery.count({ where: { userId, lastAction: { not: null } } }),
    prisma.userTitle.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { rating: true, title: { select: { id: true, name: true, slug: true, imageUrl: true } } },
    }),
  ]);
  return { library, ratings: rated._count.rating, average: rated._avg.rating ?? 0, reviews, lists, discovered, recent };
}

export default async function DashboardWelcome({ userId, username }: { userId: string; username: string }) {
  const [summary, member] = await Promise.all([
    getLibrarySummary(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, isGuest: true } }),
  ]);
  const storyUnlocked = member?.plan === "PRO" || member?.isGuest === true;
  const year = new Date().getUTCFullYear();
  const stats = [
    { label: "In your library", value: summary.library, icon: BookMarked, href: `/users/${username}` },
    { label: "Ratings given", value: summary.ratings, icon: Star, href: `/users/${username}` },
    { label: "Reviews written", value: summary.reviews, icon: MessageSquareQuote, href: `/users/${username}` },
    { label: "Lists curated", value: summary.lists, icon: ListChecks, href: "/my-lists" },
  ];

  const steps = [
    { label: "Add your first title", done: summary.library > 0, href: "/titles" },
    { label: "Rate three titles", done: summary.ratings >= 3, href: "/titles" },
    { label: "Write a review", done: summary.reviews > 0, href: "/titles" },
    { label: "Swipe through Discover", done: summary.discovered > 0, href: "/discover" },
    { label: "Create a list", done: summary.lists > 0, href: "/my-lists" },
  ];
  const completed = steps.filter((step) => step.done).length;

  return (
    <>
    <section className="dashboard-panel-in flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm text-white/45">Welcome back</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          @{username}
          {summary.ratings > 0 && (
            <span className="ml-3 align-middle text-sm font-medium text-white/40">
              avg. <span className="text-gradient font-semibold">{summary.average.toFixed(1)}</span> / 10
            </span>
          )}
        </h1>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[560px]">
        {stats.map(({ label, value, icon: Icon, href }, index) => (
          <Link
            key={label}
            href={href}
            style={{ animationDelay: `${120 + index * 70}ms` }}
            className="dashboard-pick-in group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between">
              <Icon className="size-4 text-violet-300/80" />
              <ArrowRight className="size-3.5 -translate-x-1 text-white/0 transition group-hover:translate-x-0 group-hover:text-white/50" />
            </div>
            <CountUp value={value} className="mt-2 block text-2xl font-semibold tracking-tight text-white" />
            <p className="text-xs text-white/45">{label}</p>
          </Link>
        ))}
      </div>
    </section>
    {summary.library >= 5 && (
      <Link
        href={storyUnlocked ? "/stats/wrapped" : "/settings/billing"}
        className="dashboard-panel-in group relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/20 to-sky-600/20 p-5 transition hover:border-fuchsia-300/40"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <span className="relative">
          <span className="block text-xs font-semibold tracking-[0.2em] text-fuchsia-200/80 uppercase">{storyUnlocked ? "New" : "Pro"}</span>
          <span className="mt-1 block text-lg font-semibold text-white sm:text-xl">Your {year} in review is ready</span>
          <span className="block text-sm text-white/65">Busiest month, favourite genre, rating persona and your top-rated titles.</span>
        </span>
        <span className="relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-black transition group-hover:-translate-y-0.5">
          {storyUnlocked ? "Play story" : "Unlock"} <ArrowRight className="size-4" />
        </span>
      </Link>
    )}
    {completed < steps.length && (
      <section aria-label="Get started" className="dashboard-panel-in relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-r from-violet-500/[0.10] via-white/[0.02] to-sky-500/[0.06] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Get started with Listiq</p>
            <p className="text-xs text-white/50">{completed} of {steps.length} done — each step makes your recommendations and insights smarter.</p>
          </div>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-700" style={{ width: `${(completed / steps.length) * 100}%` }} />
          </div>
        </div>
        <ol className="mt-4 flex flex-wrap gap-2">
          {steps.map((step) => (
            <li key={step.label}>
              <Link
                href={step.href}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${step.done ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white"}`}
              >
                <span className={`grid size-4 place-items-center rounded-full ${step.done ? "bg-emerald-400 text-black" : "border border-white/25"}`}>{step.done && <Check className="size-3" />}</span>
                {step.label}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    )}
    {summary.recent.length > 0 && (
      <section aria-labelledby="recent-library" className="dashboard-panel-in">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-library" className="text-lg font-semibold text-white">Recently in your library</h2>
          <Link href="/stats" className="inline-flex items-center gap-1 text-sm text-white/45 transition hover:translate-x-0.5 hover:text-white">Your insights <ArrowRight className="size-4" /></Link>
        </div>
        <ul className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
          {summary.recent.map(({ title, rating }, index) => (
            <li key={title.id} style={{ animationDelay: `${index * 50}ms` }} className="dashboard-card-pop-in w-28 shrink-0 sm:w-32">
              <Link href={`/titles/${title.slug}`} className="group block">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-violet-400/40">
                  {title.imageUrl && <Image src={title.imageUrl} alt={title.name} fill sizes="128px" className="object-cover transition duration-700 group-hover:scale-105" unoptimized />}
                  {rating !== null && (
                    <span className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                      <Star className="size-2.5 fill-violet-400 text-violet-400" />{rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-xs text-white/65 group-hover:text-white">{title.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )}
    </>
  );
}
