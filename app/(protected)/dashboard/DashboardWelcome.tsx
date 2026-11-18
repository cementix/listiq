import Link from "next/link";
import { ArrowRight, BookMarked, Check, ListChecks, MessageSquareQuote, Star } from "lucide-react";

import { CountUp } from "@/components/landing/primitives";
import { prisma } from "@/lib/prisma";

async function getLibrarySummary(userId: string) {
  const [library, rated, reviews, lists, discovered] = await Promise.all([
    prisma.userTitle.count({ where: { userId } }),
    prisma.userTitle.aggregate({ where: { userId, rating: { not: null } }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.userTitle.count({ where: { userId, note: { not: null } } }),
    prisma.titleList.count({ where: { userId, systemType: null } }),
    prisma.userTitleDiscovery.count({ where: { userId, lastAction: { not: null } } }),
  ]);
  return { library, ratings: rated._count.rating, average: rated._avg.rating ?? 0, reviews, lists, discovered };
}

export default async function DashboardWelcome({ userId, username }: { userId: string; username: string }) {
  const summary = await getLibrarySummary(userId);
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
    </>
  );
}
