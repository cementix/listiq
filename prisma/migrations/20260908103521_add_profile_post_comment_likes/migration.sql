-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PROFILE_POST_COMMENT_LIKE';

-- CreateTable
CREATE TABLE "ProfilePostCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePostCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfilePostCommentLike_userId_idx" ON "ProfilePostCommentLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePostCommentLike_commentId_userId_key" ON "ProfilePostCommentLike"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "ProfilePostCommentLike" ADD CONSTRAINT "ProfilePostCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ProfilePostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePostCommentLike" ADD CONSTRAINT "ProfilePostCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
