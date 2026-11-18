import type { Metadata } from "next";
import PosterFallback from "@/components/custom/PosterFallback";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Star, Users, MessageSquare, Library } from "lucide-react";

import { getTitleBySlug } from "@/actions/title/getTitleBySlug";
import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";
import TitleLibraryPanel from "./TitleLibraryPanel";
import Link from "next/link";
import SaveToListButton from "@/components/custom/SaveToListButton";
import ShareButton from "@/components/custom/ShareButton";
import SimilarTitles from "@/components/custom/SimilarTitles";
import { getSimilarTitles } from "@/lib/title/getSimilarTitles";
import TitleSourceLinks from "@/components/custom/TitleSourceLinks";

type TitleDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: TitleDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = await prisma.title.findUnique({ where: { slug }, select: { name: true, year: true, description: true, imageUrl: true } });
  if (!title) return { title: "Title not found" };
  return {
    title: title.year ? `${title.name} (${title.year})` : title.name,
    description: title.description?.slice(0, 160) ?? undefined,
    openGraph: title.imageUrl ? { images: [{ url: title.imageUrl }] } : undefined,
  };
}

export default async function TitleDetailsPage({
  params,
}: TitleDetailsPageProps) {
  const { slug } = await params;
  const title = await getTitleBySlug(slug);

  if (!title) {
    notFound();
  }

  const averageRating = title.stats.averageRating?.toFixed(1) ?? "No ratings";
  const isInLibrary = Boolean(title.currentUserTitle);
  const similar = await getSimilarTitles(title.id);
  // Other members' public ratings (the viewer's own entry is excluded), bucketed to whole points.
  const publicRatings = title.users
    .filter((entry) => entry.rating !== null && entry.id !== title.currentUserTitle?.id)
    .map((entry) => Math.min(10, Math.max(1, Math.round(entry.rating!))));
  const ratingBuckets = Array.from({ length: 10 }, (_, index) => publicRatings.filter((value) => value === 10 - index).length);
  const maxBucket = Math.max(1, ...ratingBuckets);

  const heroImage = title.backdropUrl ?? title.imageUrl;
  const typeLabel = title.type.charAt(0) + title.type.slice(1).toLowerCase();

  return (
    <div className="relative isolate">
      {heroImage && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden">
          <Image src={heroImage} alt="" fill sizes="100vw" className="animate-kenburns object-cover opacity-60 blur-xl saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/55 to-black" />
        </div>
      )}
    <PageSection className="mx-auto w-full max-w-6xl px-4">
      <div className="grid items-start gap-4 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
        <GlassCard className="group/poster mx-auto w-full max-w-60 overflow-hidden p-0 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-700 hover:border-white/25 hover:shadow-[0_30px_90px_-30px_rgba(139,92,246,0.6)] md:sticky md:top-24 md:max-w-none">
          <div className="relative aspect-3/4 overflow-hidden bg-black/30">
            {title.imageUrl ? (
              <Image
                src={title.imageUrl}
                alt={title.name}
                fill
                className="object-cover transition duration-700 group-hover/poster:scale-105"
                priority
              />
            ) : (
              <PosterFallback name={title.name} />
            )}
          </div>
        </GlassCard>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          <GlassCard className="bg-black/30 p-4 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-700 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/50">
                  {typeLabel}
                  {title.year ? ` · ${title.year}` : ""}
                </p>

                <h1 className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
                  {title.name}
                </h1>
                <TitleSourceLinks sources={title.externalTitles} />

                {title.createdBy && (
                  <p className="mt-2 text-sm text-white/55">
                    Added by{" "}
                    <Link
                      href={`/users/${title.createdBy.username}`}
                      className="text-white/70 transition hover:text-white"
                    >
                      @{title.createdBy.username}
                    </Link>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ShareButton path={`/title/${title.slug}`} title={title.name} />
                <SaveToListButton titleId={title.id} />
              </div>
            </div>

            {title.genres.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {title.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/70"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
          </GlassCard>

          <TitleLibraryPanel
            titleId={title.id}
            currentUserTitle={title.currentUserTitle}
          />

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <GlassCard className="p-4">
              <Users className="size-5 text-white/55" />
              <p className="mt-4 text-2xl font-semibold">
                {title.stats.libraryCount}
              </p>
              <p className="text-sm text-white/50">In libraries</p>
            </GlassCard>

            <GlassCard className="p-4">
              <Star className="size-5 text-primary/80" />
              <p className="mt-3 text-2xl font-semibold">{averageRating}</p>
              <p className="text-sm text-white/50">
                {title.stats.ratingCount} ratings
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <MessageSquare className="size-5 text-white/55" />
              <p className="mt-3 text-2xl font-semibold">
                {title.stats.reviewCount}
              </p>
              <p className="text-sm text-white/50">Reviews</p>
            </GlassCard>

            <GlassCard className="p-4">
              <Library className="size-5 text-primary/80" />
              <p className="mt-3 text-2xl font-semibold">
                {isInLibrary ? "Added" : "Not added"}
              </p>
              <p className="text-sm text-white/50">Your library</p>
            </GlassCard>
          </div>
        </div>
      </div>

      {publicRatings.length > 0 && (
        <GlassCard className="p-4 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Community ratings</h2>
            <p className="text-sm text-white/60">{publicRatings.length} public {publicRatings.length === 1 ? "rating" : "ratings"}</p>
          </div>
          <ul className="mt-4 space-y-1.5">
            {ratingBuckets.map((count, index) => (
              <li key={index} className="flex items-center gap-3 text-xs">
                <span className="w-6 text-right text-white/60">{10 - index}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <span className="animate-grow-x block h-full origin-left rounded-full bg-gradient-to-r from-violet-600 to-violet-400" style={{ width: `${(count / maxBucket) * 100}%`, animationDelay: `${index * 40}ms` }} />
                </span>
                <span className="w-6 text-white/60">{count}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-white">Reviews</h2>

        <div className="mt-4 space-y-3">
          {title.users.filter((entry) => entry.rating || entry.note).length ===
          0 ? (
            <p className="text-sm text-white/50">No reviews yet.</p>
          ) : (
            title.users
              .filter((entry) => entry.rating || entry.note)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/users/${entry.user.username}`}
                      className="group flex items-center gap-2.5 font-medium text-white"
                    >
                      <span aria-hidden className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400/45 to-violet-500/45 text-xs font-semibold">
                        {entry.user.username.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="transition group-hover:text-violet-300">@{entry.user.username}</span>
                    </Link>
                    {entry.rating && (
                      <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-200">
                        <Star className="size-3 fill-current" />
                        {entry.rating.toFixed(1)}/10
                      </span>
                    )}
                  </div>

                  {entry.note && (
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      {entry.note}
                    </p>
                  )}
                </div>
              ))
          )}
        </div>
      </GlassCard>
      <SimilarTitles titles={similar} basePath="/titles" />
    </PageSection>
    </div>
  );
}
