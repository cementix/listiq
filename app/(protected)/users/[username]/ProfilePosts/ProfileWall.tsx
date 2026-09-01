import GlassCard from "@/components/custom/GlassCard";
import ProfilePostForm from "./ProfilePostForm";
import ProfilePostCard from "./ProfilePostCard";

type ProfilePost = {
  id: string;
  content: string | null;
  createdAt: Date;
  author: {
    username: string;
    avatarUrl: string | null;
  };
  likes: { id: string; userId: string }[];
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      username: string;
      avatarUrl: string | null;
    };
  }[];
};

type ProfileWallProps = {
  posts: ProfilePost[];
  isOwnProfile: boolean;
  currentUserId: string;
  currentUser: {
    username: string;
    avatarUrl: string | null;
  };
};

export default function ProfileWall({
  posts,
  isOwnProfile,
  currentUserId,
  currentUser,
}: ProfileWallProps) {
  return (
    <GlassCard className="p-5">
      <h2 className="text-xl font-semibold text-white">Wall</h2>

      <div className="mt-4 space-y-4">
        {isOwnProfile && <ProfilePostForm />}

        {posts.length === 0 ? (
          <p className="text-sm text-white/50">No posts yet</p>
        ) : (
          posts.map((post) => (
            <ProfilePostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              currentUser={currentUser}
            />
          ))
        )}
      </div>
    </GlassCard>
  );
}
