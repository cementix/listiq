import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

import PageSection from "@/components/custom/PageSection";
import YearStory from "@/components/stats/YearStory";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getYearInReview } from "@/lib/stats/getYearInReview";

export const metadata: Metadata = { title: "Year in review" };

type Props = { searchParams: Promise<{ year?: string }> };

export default async function WrappedPage({ searchParams }: Props) {
  const session = await requireAuth();
  const member = await prisma.user.findUnique({ where: { id: session.userId }, select: { plan: true, isGuest: true } });
  const unlocked = member?.plan === "PRO" || member?.isGuest === true;

  if (!unlocked) {
    return (
      <PageSection className="mx-auto w-full max-w-3xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-600/25 via-fuchsia-600/10 to-black p-10 text-center">
          <div aria-hidden className="absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-violet-500/30 blur-3xl animate-glow" />
          <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-white/10"><Lock className="size-6" /></span>
          <h1 className="relative mt-5 text-3xl font-semibold tracking-tight">Year in review is part of Pro</h1>
          <p className="relative mx-auto mt-3 max-w-md text-white/65">An animated story of your year — busiest month, favourite genre, rating persona and your top-rated titles.</p>
          <Link href="/settings/billing" className="relative mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:-translate-y-0.5">
            <Sparkles className="size-4 text-violet-600" /> Unlock in test mode
          </Link>
        </div>
      </PageSection>
    );
  }

  const requested = Number((await searchParams).year);
  const currentYear = new Date().getUTCFullYear();
  const year = Number.isInteger(requested) && requested >= 2000 && requested <= currentYear ? requested : currentYear;
  let data = await getYearInReview(session.userId, year);
  // Early in January there may be nothing yet; show last year instead of an empty story.
  if (data.total === 0 && year === currentYear) {
    const previous = await getYearInReview(session.userId, year - 1);
    if (previous.total > 0) data = previous;
  }

  if (data.total === 0) {
    return (
      <PageSection className="mx-auto w-full max-w-3xl px-4">
        <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center">
          <Sparkles className="mx-auto size-8 text-violet-300" />
          <h1 className="mt-4 text-2xl font-semibold">Your year is still being written</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">Add a few titles and come back for your story.</p>
          <Link href="/discover" className="mt-6 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black">Start discovering</Link>
        </div>
      </PageSection>
    );
  }

  return <YearStory data={data} username={session.username} />;
}
