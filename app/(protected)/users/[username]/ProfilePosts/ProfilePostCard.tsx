"use client";

import { MessageCircle, UserRound } from "lucide-react";
import Image from "next/image";
import ProfilePostLikeButton from "./ProfilePostLikeButton";
import ProfilePostComments from "./ProfilePostComments";
import { useAppSelector } from "@/lib/store/hooks";
import Link from "next/link";
import ProfilePostMediaViewer from "./ProfilePostMediaViewer";

export type ProfilePostCardPost = {
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
    likes: { id: string; userId: string }[];
    replies: {
      id: string;
      content: string;
      createdAt: Date;
      author: {
        username: string;
        avatarUrl: string | null;
      };
      likes: { id: string; userId: string }[];
    }[];
  }[];
  attachedUserTitle: {
    id: string;
    rating: number | null;
    note: string | null;
    title: {
      name: string;
      slug: string;
      imageUrl: string | null;
      type: string;
      year: number | null;
    };
  } | null;
  media: {
    id: string;
    type: "IMAGE" | "VIDEO";
    url: string;
    width: number | null;
    height: number | null;
  }[];
};

type ProfilePostCardProps = {
  post: ProfilePostCardPost;
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

      {post.attachedUserTitle && (
        <Link
          href={`/titles/${post.attachedUserTitle.title.slug}`}
          className="mt-3 flex w-fit max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2"
        >
          <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded-md bg-white/10">
            {post.attachedUserTitle.title.imageUrl ? (
              <Image
                src={post.attachedUserTitle.title.imageUrl}
                alt={post.attachedUserTitle.title.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="max-w-56 truncate text-xs font-medium leading-4 text-white">
              {post.attachedUserTitle.title.name}
            </p>

            <div className="mt-0.5 flex items-center gap-2">
              {post.attachedUserTitle.rating !== null && (
                <span className="text-[11px] leading-4 text-primary">
                  {post.attachedUserTitle.rating.toFixed(1)}/10
                </span>
              )}

              {post.attachedUserTitle.note && (
                <span className="max-w-40 truncate text-[11px] leading-4 text-white/45">
                  {post.attachedUserTitle.note}
                </span>
              )}
            </div>
          </div>
        </Link>
      )}

      <ProfilePostMediaViewer media={post.media} />

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
