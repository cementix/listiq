-- CreateEnum
CREATE TYPE "TitleListVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "TitleList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "TitleListVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TitleList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleListItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TitleList_userId_isDefault_idx" ON "TitleList"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "TitleList_visibility_updatedAt_idx" ON "TitleList"("visibility", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TitleList_userId_slug_key" ON "TitleList"("userId", "slug");

-- CreateIndex
CREATE INDEX "TitleListItem_titleId_idx" ON "TitleListItem"("titleId");

-- CreateIndex
CREATE INDEX "TitleListItem_listId_createdAt_idx" ON "TitleListItem"("listId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TitleListItem_listId_titleId_key" ON "TitleListItem"("listId", "titleId");

-- AddForeignKey
ALTER TABLE "TitleList" ADD CONSTRAINT "TitleList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleListItem" ADD CONSTRAINT "TitleListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TitleList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleListItem" ADD CONSTRAINT "TitleListItem_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
