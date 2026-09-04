"use client";

import { MessageCircle, UserRound } from "lucide-react";
import Image from "next/image";
import ProfilePostLikeButton from "./ProfilePostLikeButton";
import ProfilePostComments from "./ProfilePostComments";
import { useAppSelector } from "@/lib/store/hooks";

type ProfilePostCardProps = {
  post: {
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
};

export default function ProfilePostCard({ post }: ProfilePostCardProps) {
  const currentUser = useAppSelector((state) => state.profilePosts.currentUser);

  const isLiked = currentUser
    ? post.likes.some((like) => like.userId === currentUser.id)
    : false;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-full bg-white/10">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={`${post.author.username} avatar`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <UserRound className="size-5 text-white/45" />
          )}
        </div>

        <div>
          <p className="font-medium text-white">@{post.author.username}</p>
          <p className="text-xs text-white/35">
            {post.createdAt.toLocaleDateString("uk-UA")}
          </p>
        </div>
      </div>

      {post.content && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/70">
          {post.content}
        </p>
      )}

      <div className="mt-2 pt-2 flex items-center gap-4 border-t border-white/10  text-sm text-white/45">
        <ProfilePostLikeButton
          postId={post.id}
          likesCount={post.likes.length}
          isLiked={isLiked}
        />

        <span className="flex items-center gap-1.5">
          <MessageCircle className="size-4" />
          {post.comments.length}
        </span>
      </div>

      <ProfilePostComments postId={post.id} comments={post.comments} />
    </article>
  );
}
