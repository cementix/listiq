-- CreateEnum
CREATE TYPE "ExternalTitleProvider" AS ENUM ('RAWG', 'TMDB_MOVIE', 'TMDB_TV', 'ANILIST');

-- AlterTable
ALTER TABLE "Title" ADD COLUMN     "backdropUrl" TEXT,
ADD COLUMN     "releaseDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ExternalTitle" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "provider" "ExternalTitleProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalUrl" TEXT,
    "rawData" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalTitle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalTitle_titleId_idx" ON "ExternalTitle"("titleId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalTitle_provider_externalId_key" ON "ExternalTitle"("provider", "externalId");

-- AddForeignKey
ALTER TABLE "ExternalTitle" ADD CONSTRAINT "ExternalTitle_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
