/*
  Warnings:

  - You are about to drop the column `isDefault` on the `TitleList` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,systemType]` on the table `TitleList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TitleListSystemType" AS ENUM ('SAVE_FOR_LATER');

-- DropIndex
DROP INDEX "TitleList_userId_isDefault_idx";

-- DropIndex
DROP INDEX "TitleList_visibility_updatedAt_idx";

-- DropIndex
DROP INDEX "TitleListItem_listId_createdAt_idx";

-- AlterTable
ALTER TABLE "TitleList" DROP COLUMN "isDefault",
ADD COLUMN     "systemType" "TitleListSystemType";

-- AlterTable
ALTER TABLE "TitleListItem" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "TitleList_userId_createdAt_idx" ON "TitleList"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TitleList_visibility_createdAt_idx" ON "TitleList"("visibility", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TitleList_userId_systemType_key" ON "TitleList"("userId", "systemType");

-- CreateIndex
CREATE INDEX "TitleListItem_listId_position_idx" ON "TitleListItem"("listId", "position");
