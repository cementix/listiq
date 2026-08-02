-- CreateEnum
CREATE TYPE "ActivityEventType" AS ENUM ('TITLE_ADDED', 'TITLE_REMOVED', 'TITLE_RATED', 'TITLE_REVIEWED', 'TITLE_SUBMITTED');

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" TEXT,
    "submissionId" TEXT,
    "type" "ActivityEventType" NOT NULL,
    "rating" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityEvent_userId_createdAt_idx" ON "ActivityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_titleId_idx" ON "ActivityEvent"("titleId");

-- CreateIndex
CREATE INDEX "ActivityEvent_submissionId_idx" ON "ActivityEvent"("submissionId");

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "TitleSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
