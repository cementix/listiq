import { notFound } from "next/navigation";

import { requireAuth } from "@/actions/auth";
import { getPublicProfileOverview } from "@/actions/profile/getPublicProfileOverview";
import PageSection from "@/components/custom/PageSection";
import { prisma } from "@/lib/prisma";
import ProfileHeader from "./ProfileHeader";
import ProfileStatsGrid from "./ProfileStatsGrid";
import ProfileReviews from "./ProfileReviews";
import ProfileActivity from "./ProfileActivity";
import ProfileWall from "./ProfilePosts/ProfileWall";
import ProfilePostsStateInitializer from "./ProfilePosts/ProfilePostStateInitializer";
import ProfileListActivity from "./ProfileListActivity";

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
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      username: true,
      avatarUrl: true,
    },
  });

  if (!profile) {
    notFound();
  }

  const isOwnProfile = session.username === profile.user.username;

  return (
    <PageSection className="mx-auto w-full max-w-375 px-4 lg:px-6">
      <ProfileHeader user={profile.user} isOwnProfile={isOwnProfile} />

      <ProfileStatsGrid stats={profile.stats} />

      <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="min-w-0 space-y-4">
          <ProfilePostsStateInitializer
            currentUser={{
              id: session.userId,
              username: currentUser?.username ?? session.username,
              avatarUrl: currentUser?.avatarUrl ?? null,
            }}
            reviewOptions={profile.latestReviews.map((review) => ({
              id: review.id,
              rating: review.rating,
              note: review.note,
              title: {
                name: review.title.name,
                slug: review.title.slug,
                imageUrl: review.title.imageUrl,
              },
            }))}
          />
          <ProfileWall posts={profile.posts} isOwnProfile={isOwnProfile} />

          <ProfileReviews reviews={profile.latestReviews} />
        </div>

        <div className="min-w-0 space-y-4">
          <ProfileListActivity items={profile.recentListActivity} />
          <ProfileActivity groups={profile.recentActivityGroups} />
        </div>
      </div>
    </PageSection>
  );
}
