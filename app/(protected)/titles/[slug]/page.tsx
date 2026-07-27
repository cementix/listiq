import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star,
  Users,
  MessageSquare,
  CheckCircle2,
  Library,
} from "lucide-react";

import { getTitleBySlug } from "@/actions/title/getTitleBySlug";
import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";

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
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <GlassCard className="overflow-hidden p-0">
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

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/50">
                  {title.type}
                  {title.year ? ` - ${title.year}` : ""}
                </p>
                <h1 className="mt-2 text-4xl font-semibold text-white">
                  {title.name}
                </h1>
                {title.createdBy && (
                  <p className="mt-2 text-sm text-white/45">
                    Added by @{title.createdBy.username}
                  </p>
                )}
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <GlassCard className="p-4">
              <Users className="size-5 text-white/45" />
              <p className="mt-4 text-2xl font-semibold">
                {title.stats.libraryCount}
              </p>
              <p className="text-sm text-white/50">In libraries</p>
            </GlassCard>

            <GlassCard className="p-4">
              <Star className="size-5 text-yellow-200/70" />
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
              <Library className="size-5 text-emerald-200/70" />
              <p className="mt-3 text-2xl font-semibold">
                {isInLibrary ? "Added" : "Not added"}
              </p>
              <p className="text-sm text-white/50">Your library</p>
            </GlassCard>
          </div>
        </div>
      </div>

      <GlassCard className="p-6">
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
                      @{entry.user.username}
                    </p>
                    {entry.rating && (
                      <p className="text-sm text-yellow-100">
                        {entry.rating}/10
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
