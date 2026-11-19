import { getSubmissionsForReview } from "@/actions/submissions/getSubmissionsForReview";
import PageHeader from "@/components/custom/PageHeader";
import { ShieldCheck } from "lucide-react";
import PageSection from "@/components/custom/PageSection";
import SubmissionsReviewList from "./SubmissionsReviewList";

export default async function SubmissionsPage() {
  const submissions = await getSubmissionsForReview();

  return (
    <PageSection className="mx-auto w-full max-w-6xl px-4">
      <PageHeader eyebrow="Moderation" title="Title submissions" description="Review pending title submissions and move approved ones into the main database." icon={<ShieldCheck className="size-3.5" />} />

      <SubmissionsReviewList submissions={submissions} />
    </PageSection>
  );
}
