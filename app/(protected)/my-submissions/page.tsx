import { getMySubmissions } from "@/actions/submissions/getMySubmissions";
import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";

import getGenres from "@/actions/title/getGenres";
import MySubmissionsList from "./MySubmissionsList";

const statusClass = {
  PENDING: "border-yellow-400/20 bg-yellow-400/10 text-yellow-200",
  RESUBMITTED: "border-yellow-400/20 bg-yellow-400/10 text-yellow-200",
  NEEDS_CHANGES: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  APPROVED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  REJECTED: "border-red-400/20 bg-red-400/10 text-red-200",
};

export default async function MySubmissionsPage() {
  const [submissions, genres] = await Promise.all([
    getMySubmissions(),
    getGenres(),
  ]);

  return (
    <PageSection className="mx-auto w-full max-w-6xl px-4">
      <GlassCard className="p-6">
        <p className="text-sm text-white/50">Submissions</p>
        <h1 className="mt-2 text-3xl font-semibold">My Submissions</h1>
        <p className="mt-3 max-w-xl text-white/70">
          Track review status and moderator feedback for titles you submitted.
        </p>
      </GlassCard>

      <MySubmissionsList submissions={submissions} genres={genres} />
    </PageSection>
  );
}
