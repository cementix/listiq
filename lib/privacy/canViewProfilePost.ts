import "server-only";

type PostVisibility = {
  authorId: string;
  attachedUserTitleId: string | null;
  author: {
    postsPublic: boolean;
    reviewsPublic: boolean;
  };
};

export function canViewProfilePost(
  post: PostVisibility,
  viewerId: string,
): boolean {
  if (post.authorId === viewerId) return true;

  return (
    post.author.postsPublic &&
    (post.attachedUserTitleId === null || post.author.reviewsPublic)
  );
}
