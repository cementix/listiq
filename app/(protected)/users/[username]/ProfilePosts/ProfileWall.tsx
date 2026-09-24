import GlassCard from "@/components/custom/GlassCard";
import ProfilePrivacyHint from "../ProfilePrivacyHint";
import ProfilePostForm from "./ProfilePostForm";
import ProfilePostCard, { type ProfilePostCardPost } from "./ProfilePostCard";

type ProfileWallProps = {
  posts: ProfilePostCardPost[];
  isOwnProfile: boolean;
  privateForOthers?: boolean;
};

export default function ProfileWall({
  posts,
  isOwnProfile,
  privateForOthers = false,
}: ProfileWallProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-white">Wall</h2>
        {privateForOthers && <ProfilePrivacyHint />}
      </div>

      <div className="mt-4 space-y-4">
        {isOwnProfile && <ProfilePostForm />}

        {posts.length === 0 ? (
          <p className="text-sm text-white/50">No posts yet</p>
        ) : (
          posts.map((post) => <ProfilePostCard key={post.id} post={post} />)
        )}
      </div>
    </GlassCard>
  );
}
