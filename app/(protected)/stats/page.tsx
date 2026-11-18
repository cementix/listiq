import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Flame, MessageSquareQuote, Sparkles, Star, Trophy } from "lucide-react";

import PageHeader from "@/components/custom/PageHeader";
import PageSection from "@/components/custom/PageSection";
import { CountUp } from "@/components/landing/primitives";
import { BarList, ChartCard, ColumnChart, Heatmap } from "@/components/stats/Charts";
import { requireAuth } from "@/lib/auth/guards";
import { getUserInsights } from "@/lib/stats/getUserInsights";

export const metadata: Metadata = { title: "Your insights · Listiq" };

const TYPE_LABEL: Record<string, string> = {
  MOVIE: "Movies", SERIES: "Series", ANIME: "Anime", MANGA: "Manga", MANHWA: "Manhwa",
  BOOK: "Books", GAME: "Games", NOVEL: "Novels", COMIC: "Comics", OTHER: "Other",
};

export default async function StatsPage() {
  const session = await requireAuth();
  const insights = await getUserInsights(session.userId);
  const { totals } = insights;

  const tiles = [
    { label: "Titles in library", value: totals.library, icon: BarChart3 },
    { label: "Ratings given", value: totals.rated, icon: Star },
    { label: "Reviews written", value: totals.reviews, icon: MessageSquareQuote },
    { label: "Day activity streak", value: insights.streakDays, icon: Flame },
  ];

  if (totals.library === 0) {
    return (
      <PageSection className="mx-auto w-full max-w-6xl px-4">
        <PageHeader eyebrow="Insights" title="Your taste, visualised" icon={<BarChart3 className="size-3.5" />} />
        <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center">
          <Sparkles className="mx-auto size-8 text-violet-300" />
          <p className="mt-4 text-lg font-semibold">Nothing to chart yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">Add and rate a few titles — your rating curve, favourite genres and activity heatmap appear here.</p>
          <Link href="/discover" className="mt-6 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black">Start discovering</Link>
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection className="mx-auto w-full max-w-6xl px-4">
      <PageHeader
        eyebrow="Insights"
        title={<>Your taste, <span className="font-display font-normal italic text-gradient">visualised</span></>}
        description={totals.average !== null ? `You rate titles ${totals.average.toFixed(1)} on average across ${totals.rated} ratings and ${totals.lists} lists.` : "Rate a few titles to see your rating curve."}
        icon={<BarChart3 className="size-3.5" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon }, index) => (
          <div key={label} style={{ animationDelay: `${index * 70}ms` }} className="dashboard-pick-in rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Icon className="size-4 text-violet-300" />
            <CountUp value={value} className="mt-3 block text-3xl font-semibold tracking-tight text-white sm:text-4xl" />
            <p className="mt-1 text-sm text-white/45">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard className="lg:col-span-3" title="How you rate" subtitle="Number of titles at each score, rounded to the nearest point">
          <ColumnChart unit="titles" data={insights.ratingBuckets.map((bucket) => ({ label: String(bucket.score), value: bucket.count, detail: `rated ${bucket.score}/10` }))} />
        </ChartCard>
        <ChartCard className="lg:col-span-2" title="What you track" subtitle="Library by media type">
          <BarList unit="titles" data={insights.byType.map((row) => ({ label: TYPE_LABEL[row.type] ?? row.type, value: row.count, detail: row.average !== null ? `avg ${row.average.toFixed(1)}` : undefined }))} />
        </ChartCard>
      </div>

      <ChartCard title="Activity" subtitle="Everything you added, rated or reviewed over the last 26 weeks">
        <Heatmap weeks={insights.heatmap} max={insights.heatmapMax} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Titles added per month" subtitle="Last 12 months">
          <ColumnChart unit="titles added" height={150} data={insights.monthly.map((month) => ({ label: month.label, value: month.count, detail: month.key }))} />
        </ChartCard>
        <ChartCard title="Favourite genres" subtitle="Most common genres in your library">
          {insights.genres.length ? (
            <BarList unit="titles" data={insights.genres.map((genre) => ({ label: genre.name, value: genre.count }))} />
          ) : (
            <p className="text-sm text-white/45">Genres appear once your titles have them.</p>
          )}
        </ChartCard>
      </div>

      {insights.topRated.length > 0 && (
        <ChartCard title="Your hall of fame" subtitle="Highest-rated titles in your library">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {insights.topRated.map((title, index) => (
              <Link key={title.id} href={`/titles/${title.slug}`} style={{ animationDelay: `${index * 60}ms` }} className="dashboard-card-pop-in group">
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-violet-400/40">
                  {title.imageUrl && <Image src={title.imageUrl} alt={title.name} fill sizes="160px" className="object-cover transition duration-700 group-hover:scale-105" unoptimized />}
                  {index === 0 && <span className="absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-amber-300 text-black shadow-lg"><Trophy className="size-3.5" /></span>}
                  <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                    <Star className="size-3 fill-violet-400 text-violet-400" /> {title.rating?.toFixed(1)}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm text-white/80 group-hover:text-white">{title.name}</p>
              </Link>
            ))}
          </div>
        </ChartCard>
      )}

      {insights.decades.length > 1 && (
        <ChartCard title="Across the decades" subtitle="Release years of the titles you track">
          <ColumnChart unit="titles" height={140} data={insights.decades.map((row) => ({ label: row.decade, value: row.count }))} />
        </ChartCard>
      )}
    </PageSection>
  );
}
