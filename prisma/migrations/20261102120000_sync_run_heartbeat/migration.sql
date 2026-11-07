ALTER TABLE "SyncRun" ADD COLUMN "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "workflowRunId" TEXT;
UPDATE "SyncRun" SET "heartbeatAt" = COALESCE("finishedAt", "startedAt");
