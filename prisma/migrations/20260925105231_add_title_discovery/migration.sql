-- CreateEnum
CREATE TYPE "DiscoveryAction" AS ENUM ('SKIPPED', 'SAVED_FOR_LATER', 'ADDED_TO_LIBRARY');

-- CreateTable
CREATE TABLE "UserTitleDiscovery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "shownCount" INTEGER NOT NULL DEFAULT 0,
    "lastShownAt" TIMESTAMP(3),
    "skipCount" INTEGER NOT NULL DEFAULT 0,
    "lastAction" "DiscoveryAction",
    "lastActionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTitleDiscovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserTitleDiscovery_userId_lastShownAt_idx" ON "UserTitleDiscovery"("userId", "lastShownAt");

-- CreateIndex
CREATE INDEX "UserTitleDiscovery_titleId_idx" ON "UserTitleDiscovery"("titleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTitleDiscovery_userId_titleId_key" ON "UserTitleDiscovery"("userId", "titleId");

-- AddForeignKey
ALTER TABLE "UserTitleDiscovery" ADD CONSTRAINT "UserTitleDiscovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTitleDiscovery" ADD CONSTRAINT "UserTitleDiscovery_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
