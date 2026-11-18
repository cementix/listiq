export const metadata = { title: "My submissions" };
import { getMySubmissions } from "@/actions/submissions/getMySubmissions";
import PageHeader from "@/components/custom/PageHeader";
import { Inbox } from "lucide-react";
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
      <PageHeader eyebrow="Submissions" title="My submissions" description="Track review status and moderator feedback for titles you submitted." icon={<Inbox className="size-3.5" />} />

      <MySubmissionsList submissions={submissions} genres={genres} />
    </PageSection>
  );
}
