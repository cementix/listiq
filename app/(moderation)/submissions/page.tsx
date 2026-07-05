import { getSubmissionsForReview } from "@/actions/submissions/getSubmissionsForReview";
import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";
import SubmissionsReviewList from "./SubmissionsReviewList";

export default async function SubmissionsPage() {
  const submissions = await getSubmissionsForReview();

  return (
    <PageSection className="mx-auto w-full max-w-6xl px-4">
      <GlassCard className="p-6">
        <p className="text-sm text-white/50">Moderation</p>
        <h1 className="mt-2 text-3xl font-semibold">Title submissions</h1>
        <p className="mt-3 max-w-xl text-white/70">
          Review pending title submissions and move approved ones into the main
          database.
        </p>
      </GlassCard>

      <SubmissionsReviewList submissions={submissions} />
    </PageSection>
  );
}
