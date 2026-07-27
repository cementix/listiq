import { getMySubmissions } from "@/actions/submissions/getMySubmissions";
import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";

import getGenres from "@/actions/title/getGenres";
import MySubmissionsList from "./MySubmissionsList";

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
