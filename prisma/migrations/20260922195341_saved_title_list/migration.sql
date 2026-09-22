-- CreateTable
CREATE TABLE "SavedTitleList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedTitleList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedTitleList_userId_createdAt_idx" ON "SavedTitleList"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedTitleList_listId_idx" ON "SavedTitleList"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedTitleList_userId_listId_key" ON "SavedTitleList"("userId", "listId");

-- AddForeignKey
ALTER TABLE "SavedTitleList" ADD CONSTRAINT "SavedTitleList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedTitleList" ADD CONSTRAINT "SavedTitleList_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TitleList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
