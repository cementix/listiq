import Link from "next/link";
import { BookOpen, MessageSquare, Star, Trophy, UserRound } from "lucide-react";

import { getProfileOverview } from "@/actions/profile/getProfileOverview";
import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";

const ProfilePage = async () => {
  const profile = await getProfileOverview();
  const averageRating = profile.stats.averageRating?.toFixed(1) ?? "-";

  return (
    <PageSection className="mx-auto w-full max-w-375 px-4 lg:px-6">
      <GlassCard className="overflow-hidden p-0">
        <div className="h-36 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.35),transparent_35%),linear-gradient(135deg,rgba(15,23,42,1),rgba(0,0,0,1))]" />

        <div className="flex flex-wrap items-end justify-between gap-4 p-6 pt-0">
          <div className="-mt-12 flex items-end gap-4">
            <div className="flex size-24 items-center justify-center rounded-2xl border border-white/10 bg-black text-white shadow-2xl">
              <UserRound className="size-10 text-white/60" />
            </div>

            <div className="pb-1">
              <p className="text-sm text-white/45">{profile.user.role}</p>
              <h1 className="text-3xl font-semibold text-white">
                @{profile.user.username}
              </h1>
              <p className="mt-1 text-sm text-white/50">{profile.user.email}</p>
            </div>
          </div>

          <p className="text-sm text-white/45">
            Joined {profile.user.createdAt.toLocaleDateString("en-US")}
          </p>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-4">
          <BookOpen className="size-5 text-white/45" />
          <p className="mt-3 text-2xl font-semibold">
            {profile.stats.libraryCount}
          </p>
          <p className="text-sm text-white/50">Library</p>
        </GlassCard>

        <GlassCard className="p-4">
          <Star className="size-5 text-primary/80" />
          <p className="mt-3 text-2xl font-semibold">{averageRating}</p>
          <p className="text-sm text-white/50">
            {profile.stats.ratingCount} ratings
          </p>
        </GlassCard>

        <GlassCard className="p-4">
          <MessageSquare className="size-5 text-white/45" />
          <p className="mt-3 text-2xl font-semibold">
            {profile.stats.reviewCount}
          </p>
          <p className="text-sm text-white/50">Reviews</p>
        </GlassCard>

        <GlassCard className="p-4">
          <BookOpen className="size-5 text-white/45" />
          <p className="mt-3 text-2xl font-semibold">
            {profile.stats.submissionsCount}
          </p>
          <p className="text-sm text-white/50">Submissions</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <GlassCard className="p-5">
          <h2 className="text-xl font-semibold text-white">Recent activity</h2>

          <div className="mt-4 space-y-3">
            {profile.recentLibrary.length === 0 ? (
              <p className="text-sm text-white/50">No activity yet.</p>
            ) : (
              profile.recentLibrary.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/titles/${entry.title.slug}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/10"
                >
                  <div>
                    <p className="font-medium text-white">
                      Added {entry.title.name}
                    </p>
                    <p className="mt-1 text-sm text-white/45">
                      {entry.title.type}
                      {entry.title.year ? ` . ${entry.title.year}` : ""}
                    </p>
                  </div>

                  <div className="text-right text-sm text-white/45">
                    {entry.rating ? (
                      <p className="text-primary">
                        {entry.rating.toFixed(1)}/10
                      </p>
                    ) : (
                      <p>No rating</p>
                    )}
                    <p>{entry.updatedAt.toLocaleDateString("en-US")}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-xl font-semibold text-white">Latest reviews</h2>

          <div className="mt-4 space-y-3">
            {profile.latestReviews.length === 0 ? (
              <p className="text-sm text-white/50">No reviews yet.</p>
            ) : (
              profile.latestReviews.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/titles/${entry.title.slug}`}
                  className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{entry.title.name}</p>
                    {entry.rating && (
                      <p className="text-sm text-primary">
                        {entry.rating.toFixed(1)}/10
                      </p>
                    )}
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                    {entry.note}
                  </p>
                </Link>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </PageSection>
  );
};

export default ProfilePage;
