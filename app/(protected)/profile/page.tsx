import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  MinusCircle,
  PlusCircle,
  Send,
  Star,
  UserRound,
} from "lucide-react";

import { getProfileOverview } from "@/actions/profile/getProfileOverview";
import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";

const ProfilePage = async () => {
  const profile = await getProfileOverview();
  const averageRating = profile.stats.averageRating?.toFixed(1) ?? "-";

  const getActivityCopy = (event: (typeof profile.recentActivity)[number]) => {
    if (event.type === "TITLE_ADDED") return "Added to library";
    if (event.type === "TITLE_RATED")
      return `Rated ${event.rating?.toFixed(1) ?? "-"}/10`;
    if (event.type === "TITLE_REMOVED") return "Removed from library";
    if (event.type === "TITLE_REVIEWED") return "Reviewed";
    if (event.type === "TITLE_SUBMITTED") return "Submitted title";

    return event.type;
  };

  const getActivityIcon = (
    type: (typeof profile.recentActivity)[number]["type"],
  ) => {
    if (type === "TITLE_ADDED") return PlusCircle;
    if (type === "TITLE_REMOVED") return MinusCircle;
    if (type === "TITLE_RATED") return Star;
    if (type === "TITLE_REVIEWED") return MessageSquare;
    if (type === "TITLE_SUBMITTED") return Send;

    return CheckCircle2;
  };

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
            {profile.recentActivity.length === 0 ? (
              <p className="text-sm text-white/50">No activity yet.</p>
            ) : (
              profile.recentActivity.slice(0, 5).map((event) => {
                const ActivityIcon = getActivityIcon(event.type);
                const href = event.title
                  ? `/titles/${event.title.slug}`
                  : "/my-submissions";
                const title =
                  event.title?.name ??
                  event.submission?.name ??
                  "Unknown title";

                return (
                  <Link
                    key={event.id}
                    href={href}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <ActivityIcon className="size-4 text-primary/80" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {title}
                        </p>
                        <p className="mt-1 text-sm text-white/45">
                          {getActivityCopy(event)}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-right text-sm text-white/45">
                      {event.createdAt.toLocaleDateString("en-US")}
                    </p>
                  </Link>
                );
              })
            )}
            {profile.recentActivity.length > 5 && (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/55 transition hover:bg-white/10 hover:text-white">
                  Show older activity
                  <ChevronDown className="size-4 transition group-open:rotate-180" />
                </summary>

                <div className="mt-3 space-y-3">
                  {profile.recentActivity.slice(5).map((event) => {
                    const ActivityIcon = getActivityIcon(event.type);
                    const href = event.title
                      ? `/titles/${event.title.slug}`
                      : "/my-submissions";
                    const title =
                      event.title?.name ??
                      event.submission?.name ??
                      "Unknown title";

                    return (
                      <Link
                        key={event.id}
                        href={href}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/10"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                            <ActivityIcon className="size-4 text-primary/80" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {title}
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                              {getActivityCopy(event)}
                            </p>
                          </div>
                        </div>

                        <p className="shrink-0 text-right text-xs text-white/45">
                          {event.createdAt.toLocaleDateString("en-US")}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </details>
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
