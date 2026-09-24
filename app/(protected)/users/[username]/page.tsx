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
import PrivateProfileSection from "./PrivateProfileSection";
import ProfilePrivacyHint from "./ProfilePrivacyHint";

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

  const isOwnProfile = session.userId === profile.user.id;
  const showPosts = isOwnProfile || profile.user.postsPublic;
  const showReviews = isOwnProfile || profile.user.reviewsPublic;
  const showListActivity = isOwnProfile || profile.user.listActivityPublic;
  const showTitleActivity = isOwnProfile || profile.user.titleActivityPublic;

  return (
    <PageSection className="mx-auto w-full max-w-375 px-4 lg:px-6">
      <ProfileHeader user={profile.user} isOwnProfile={isOwnProfile} />

      {profile.stats ? (
        <div className="space-y-2">
          {isOwnProfile && !profile.user.statsPublic && (
            <div className="flex justify-end">
              <ProfilePrivacyHint />
            </div>
          )}
          <ProfileStatsGrid stats={profile.stats} />
        </div>
      ) : (
        <PrivateProfileSection title="Statistics" />
      )}

      <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="min-w-0 space-y-4">
          {showPosts ? (
            <>
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
              <ProfileWall
                posts={profile.posts}
                isOwnProfile={isOwnProfile}
                privateForOthers={isOwnProfile && !profile.user.postsPublic}
              />
            </>
          ) : (
            <PrivateProfileSection title="Posts" />
          )}

          {showReviews ? (
            <ProfileReviews
              reviews={profile.latestReviews}
              privateForOthers={isOwnProfile && !profile.user.reviewsPublic}
            />
          ) : (
            <PrivateProfileSection title="Reviews" />
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {showListActivity ? (
            <ProfileListActivity
              items={profile.recentListActivity}
              privateForOthers={isOwnProfile && !profile.user.listActivityPublic}
            />
          ) : (
            <PrivateProfileSection title="List activity" />
          )}

          {showTitleActivity ? (
            <ProfileActivity
              groups={profile.recentActivityGroups}
              privateForOthers={isOwnProfile && !profile.user.titleActivityPublic}
            />
          ) : (
            <PrivateProfileSection title="Recent activity" />
          )}
        </div>
      </div>
    </PageSection>
  );
}
