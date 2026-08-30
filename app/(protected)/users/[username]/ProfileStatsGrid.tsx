import { BookOpen, MessageSquare, Star } from "lucide-react";

import GlassCard from "@/components/custom/GlassCard";

type ProfileStatsGridProps = {
  stats: {
    libraryCount: number;
    ratingCount: number;
    reviewCount: number;
    submissionsCount: number;
    averageRating: number | null;
  };
};

export default function ProfileStatsGrid({ stats }: ProfileStatsGridProps) {
  const averageRating = stats.averageRating?.toFixed(1) ?? "-";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <GlassCard className="p-4">
        <BookOpen className="size-5 text-white/45" />
        <p className="mt-3 text-2xl font-semibold">{stats.libraryCount}</p>
        <p className="text-sm text-white/50">Library</p>
      </GlassCard>

      <GlassCard className="p-4">
        <Star className="size-5 text-primary/80" />
        <p className="mt-3 text-2xl font-semibold">{averageRating}</p>
        <p className="text-sm text-white/50">{stats.ratingCount} ratings</p>
      </GlassCard>

      <GlassCard className="p-4">
        <MessageSquare className="size-5 text-white/45" />
        <p className="mt-3 text-2xl font-semibold">{stats.reviewCount}</p>
        <p className="text-sm text-white/50">Reviews</p>
      </GlassCard>

      <GlassCard className="p-4">
        <BookOpen className="size-5 text-white/45" />
        <p className="mt-3 text-2xl font-semibold">{stats.submissionsCount}</p>
        <p className="text-sm text-white/50">Submissions</p>
      </GlassCard>
    </div>
  );
}
