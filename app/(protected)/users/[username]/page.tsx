import { notFound } from "next/navigation";

import { requireAuth } from "@/actions/auth";
import { getPublicProfileOverview } from "@/actions/profile/getPublicProfileOverview";
import PageSection from "@/components/custom/PageSection";
import ProfileHeader from "./ProfileHeader";
import ProfileStatsGrid from "./ProfileStatsGrid";
import ProfileReviews from "./ProfileReviews";
import ProfileActivity from "./ProfileActivity";

type PublicProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const session = await requireAuth();
  const profile = await getPublicProfileOverview(username);

  if (!profile) {
    notFound();
  }

  const isOwnProfile = session.username === profile.user.username;

  return (
    <PageSection className="mx-auto w-full max-w-375 px-4 lg:px-6">
      <ProfileHeader user={profile.user} isOwnProfile={isOwnProfile} />

      <ProfileStatsGrid stats={profile.stats} />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <ProfileActivity groups={profile.recentActivityGroups} />
        <ProfileReviews reviews={profile.latestReviews} />
      </div>
    </PageSection>
  );
}
