import GlassCard from "@/components/custom/GlassCard";
import ProfilePostForm from "./ProfilePostForm";
import ProfilePostCard, { type ProfilePostCardPost } from "./ProfilePostCard";

type ProfileWallProps = {
  posts: ProfilePostCardPost[];
  isOwnProfile: boolean;
};

export default function ProfileWall({ posts, isOwnProfile }: ProfileWallProps) {
  return (
    <GlassCard className="p-5">
      <h2 className="text-xl font-semibold text-white">Wall</h2>

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
