import Image from "next/image";
import { notFound } from "next/navigation";
import { Star, Users, MessageSquare, Library } from "lucide-react";

import { getTitleBySlug } from "@/actions/title/getTitleBySlug";
import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";
import TitleLibraryPanel from "./TitleLibraryPanel";
import Link from "next/link";
import SaveToListButton from "@/components/custom/SaveToListButton";
import TitleSourceLinks from "@/components/custom/TitleSourceLinks";

type TitleDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

  return (
    <PageSection className="mx-auto w-full max-w-6xl px-4">
      <div className="grid items-start gap-4 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
        <GlassCard className="mx-auto w-full max-w-60 overflow-hidden p-0 md:max-w-none">
          <div className="relative aspect-3/4 bg-black/30">
            {title.imageUrl ? (
              <Image
                src={title.imageUrl}
                alt={title.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/40">
                no image
              </div>
            )}
          </div>
        </GlassCard>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          <GlassCard className="p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/50">
                  {title.type}
                  {title.year ? ` - ${title.year}` : ""}
                </p>

                <h1 className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
                  {title.name}
                </h1>
                <TitleSourceLinks sources={title.externalTitles} />

                {title.createdBy && (
                  <p className="mt-2 text-sm text-white/45">
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

              <SaveToListButton titleId={title.id} />
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
              <Users className="size-5 text-white/45" />
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
              <MessageSquare className="size-5 text-white/45" />
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
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">
                      <Link
                        href={`/users/${entry.user.username}`}
                        className="font-medium text-white transition hover:text-primary"
                      >
                        @{entry.user.username}
                      </Link>
                    </p>
                    {entry.rating && (
                      <p className="text-sm text-primary">
                        {entry.rating.toFixed(1)}/10
                      </p>
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
    </PageSection>
  );
}
