-- AlterTable
ALTER TABLE "ExternalTitle" ADD COLUMN     "sourcePopularity" DOUBLE PRECISION,
ADD COLUMN     "sourceRating" DOUBLE PRECISION,
ADD COLUMN     "sourceRatingCount" INTEGER;

-- AlterTable
ALTER TABLE "Title" ADD COLUMN     "catalogEligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "catalogScore" DOUBLE PRECISION,
ADD COLUMN     "catalogScoredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Title_catalogEligible_catalogScore_idx" ON "Title"("catalogEligible", "catalogScore" DESC);

-- CreateIndex
CREATE INDEX "Title_type_catalogEligible_catalogScore_idx" ON "Title"("type", "catalogEligible", "catalogScore" DESC);
