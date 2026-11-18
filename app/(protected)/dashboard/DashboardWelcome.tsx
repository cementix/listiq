import Link from "next/link";
import { ArrowRight, BookMarked, ListChecks, MessageSquareQuote, Star } from "lucide-react";

import { CountUp } from "@/components/landing/primitives";
import { prisma } from "@/lib/prisma";

async function getLibrarySummary(userId: string) {
  const [library, rated, reviews, lists] = await Promise.all([
    prisma.userTitle.count({ where: { userId } }),
    prisma.userTitle.aggregate({ where: { userId, rating: { not: null } }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.userTitle.count({ where: { userId, note: { not: null } } }),
    prisma.titleList.count({ where: { userId, systemType: null } }),
  ]);
  return { library, ratings: rated._count.rating, average: rated._avg.rating ?? 0, reviews, lists };
}

export default async function DashboardWelcome({ userId, username }: { userId: string; username: string }) {
  const summary = await getLibrarySummary(userId);
  const stats = [
    { label: "In your library", value: summary.library, icon: BookMarked, href: `/users/${username}` },
    { label: "Ratings given", value: summary.ratings, icon: Star, href: `/users/${username}` },
    { label: "Reviews written", value: summary.reviews, icon: MessageSquareQuote, href: `/users/${username}` },
    { label: "Lists curated", value: summary.lists, icon: ListChecks, href: "/my-lists" },
  ];

  return (
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
  );
}
