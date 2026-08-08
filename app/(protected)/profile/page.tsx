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
import ProfileImagesForm from "./ProfileImagesForm";
import ProfileImageEditor from "./ProfileImageEditor";

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

  const getActivityIconClass = (
    type: (typeof profile.recentActivity)[number]["type"],
  ) => {
    if (type === "TITLE_ADDED") return "text-sky-300";
    if (type === "TITLE_REMOVED") return "text-indigo-300";
    if (type === "TITLE_RATED") return "text-violet-300";
    if (type === "TITLE_REVIEWED") return "text-blue-300";
    if (type === "TITLE_SUBMITTED") return "text-cyan-300";

    return "text-primary/80";
  };

  const formatRelativeDate = (date: Date) => {
    const diffMs = date.getTime() - Date.now();
    const absMs = Math.abs(diffMs);

    const units = [
      { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
      { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
      { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
      { unit: "day", ms: 1000 * 60 * 60 * 24 },
    ] as const;

    const match = units.find((item) => absMs >= item.ms);

    if (!match) return "today";

    const value = Math.round(diffMs / match.ms);

    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      value,
      match.unit,
    );
  };

  const getRoleLabel = (role: typeof profile.user.role) => {
    if (role === "ADMIN") return "Administrator";
    if (role === "MODERATOR") return "Moderator";
    if (role === "VERIFIED") return "Verified";

    return "Member";
  };

  const getRoleClassName = (role: typeof profile.user.role) => {
    if (role === "ADMIN") return "text-yellow-300";
    if (role === "MODERATOR") return "text-cyan-300";
    if (role === "VERIFIED") return "text-emerald-300";

    return "text-sky-300";
  };

  return (
    <PageSection className="mx-auto w-full max-w-375 px-4 lg:px-6">
      <GlassCard className="overflow-hidden p-0">
        <div className="mb-6">
          <ProfileImageEditor
            type="banner"
            imageUrl={profile.user.bannerUrl}
            imagePublicId={profile.user.bannerPublicId}
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 p-6 pt-0">
          <div className="-mt-12 flex items-end gap-4">
            <ProfileImageEditor
              type="avatar"
              imageUrl={profile.user.avatarUrl}
              imagePublicId={profile.user.avatarPublicId}
            />
            <div className="pb-1">
              <h1 className="text-3xl font-semibold text-white">
                @{profile.user.username}{" "}
              </h1>
              <p className="mt-1 text-sm text-white/50">
                <span className={getRoleClassName(profile.user.role)}>
                  {getRoleLabel(profile.user.role)}
                </span>
                {", "}
                joined {formatRelativeDate(profile.user.createdAt)}
              </p>
            </div>
          </div>
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
            {profile.recentActivityGroups.length === 0 ? (
              <p className="text-sm text-white/50">No activity yet.</p>
            ) : (
              <>
                {profile.recentActivityGroups.slice(0, 6).map((group) => {
                  const firstEvent = group.events[0];
                  if (!firstEvent) return null;

                  const ActivityIcon = getActivityIcon(firstEvent.type);
                  const actionCount = group.events.length;
                  const actionLabel =
                    actionCount === 1
                      ? getActivityCopy(firstEvent)
                      : `${actionCount} actions`;

                  if (actionCount === 1) {
                    return (
                      <Link
                        key={group.key}
                        href={group.href}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/10"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <ActivityIcon
                              className={`size-4 ${getActivityIconClass(firstEvent.type)}`}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              {group.title}
                            </p>
                            <p className="mt-1 text-sm text-white/45">
                              {actionLabel}
                            </p>
                          </div>
                        </div>

                        <p className="shrink-0 text-right text-sm text-white/45">
                          {group.createdAt.toLocaleDateString("en-US")}
                        </p>
                      </Link>
                    );
                  }

                  return (
                    <details
                      key={group.key}
                      className="group rounded-xl border border-white/10 bg-black/20 transition hover:bg-white/10"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <ActivityIcon className="size-4 text-primary/80" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              {group.title}
                            </p>
                            <p className="mt-1 text-sm text-white/45">
                              {actionLabel}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 text-sm text-white/45">
                          <span>
                            {group.createdAt.toLocaleDateString("en-US")}
                          </span>
                          <ChevronDown className="size-4 transition group-open:rotate-180" />
                        </div>
                      </summary>

                      <div className="border-t border-white/10 px-3 pb-3 pt-1">
                        <div className="space-y-2">
                          {group.events.map((event) => {
                            const EventIcon = getActivityIcon(event.type);

                            return (
                              <Link
                                key={event.id}
                                href={group.href}
                                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-white/5"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <EventIcon
                                    className={`size-4 shrink-0 ${getActivityIconClass(event.type)}`}
                                  />
                                  <p className="truncate text-sm text-white/65">
                                    {getActivityCopy(event)}
                                  </p>
                                </div>

                                <p className="shrink-0 text-xs text-white/35">
                                  {event.createdAt.toLocaleDateString("en-US")}
                                </p>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  );
                })}

                {profile.recentActivityGroups.length > 6 && (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/55 transition hover:bg-white/10 hover:text-white">
                      Show older activity
                      <ChevronDown className="size-4 transition group-open:rotate-180" />
                    </summary>

                    <div className="mt-3 space-y-3">
                      {profile.recentActivityGroups.slice(6).map((group) => {
                        const firstEvent = group.events[0];
                        if (!firstEvent) return null;

                        const ActivityIcon = getActivityIcon(firstEvent.type);
                        const actionCount = group.events.length;
                        const actionLabel =
                          actionCount === 1
                            ? getActivityCopy(firstEvent)
                            : `${actionCount} actions`;

                        return (
                          <details
                            key={group.key}
                            className="group rounded-xl border border-white/10 bg-black/20 transition hover:bg-white/10"
                          >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                                  <ActivityIcon
                                    className={`size-4 ${getActivityIconClass(firstEvent.type)}`}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-white">
                                    {group.title}
                                  </p>
                                  <p className="mt-1 text-xs text-white/45">
                                    {actionLabel}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2 text-xs text-white/45">
                                <span>
                                  {group.createdAt.toLocaleDateString("en-US")}
                                </span>
                                <ChevronDown className="size-4 transition group-open:rotate-180" />
                              </div>
                            </summary>

                            <div className="border-t border-white/10 px-3 pb-3 pt-1">
                              <div className="space-y-2">
                                {group.events.map((event) => {
                                  const EventIcon = getActivityIcon(event.type);

                                  return (
                                    <Link
                                      key={event.id}
                                      href={group.href}
                                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-white/5"
                                    >
                                      <div className="flex min-w-0 items-center gap-2">
                                        <EventIcon
                                          className={`size-4 shrink-0 ${getActivityIconClass(event.type)}`}
                                        />
                                        <p className="truncate text-xs text-white/65">
                                          {getActivityCopy(event)}
                                        </p>
                                      </div>

                                      <p className="shrink-0 text-xs text-white/35">
                                        {event.createdAt.toLocaleDateString(
                                          "en-US",
                                        )}
                                      </p>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-xl font-semibold text-white">Latest reviews</h2>

          <div className="mt-4 space-y-3">
            {profile.latestReviews.length === 0 ? (
              <p className="text-sm text-white/50">No reviews yet.</p>
            ) : (
              <>
                {profile.latestReviews.slice(0, 5).map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/titles/${entry.title.slug}`}
                    className="block rounded-2xl border border-white/10 bg-black/20 p-[14.5] transition hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">
                        {entry.title.name}
                      </p>
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
                ))}
                {profile.latestReviews.length > 5 && (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/55 transition hover:bg-white/10 hover:text-white">
                      Show older reviews
                      <ChevronDown className="size-4 transition group-open:rotate-180" />
                    </summary>

                    <div className="mt-3 space-y-3">
                      {profile.latestReviews.slice(5).map((entry) => (
                        <Link
                          key={entry.id}
                          href={`/titles/${entry.title.slug}`}
                          className="block rounded-xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/10"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-medium text-white">
                              {entry.title.name}
                            </p>
                            {entry.rating && (
                              <p className="shrink-0 text-xs text-primary">
                                {entry.rating.toFixed(1)}/10
                              </p>
                            )}
                          </div>

                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/60">
                            {entry.note}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        </GlassCard>
      </div>
    </PageSection>
  );
};

export default ProfilePage;
