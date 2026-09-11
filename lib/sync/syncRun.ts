import { ExternalTitleProvider } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type SyncTaskResult = {
  titlesCreated?: number;
  titlesUpdated?: number;
};

export async function hasSuccessfulSyncToday(provider?: ExternalTitleProvider) {
  const startOfTodayUtc = new Date();
  startOfTodayUtc.setUTCHours(0, 0, 0, 0);

  const syncRun = await prisma.syncRun.findFirst({
    where: {
      provider: provider ?? null,
      status: "SUCCESS",
      startedAt: {
        gte: startOfTodayUtc,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(syncRun);
}

export async function startSyncRun(provider?: ExternalTitleProvider) {
  return prisma.syncRun.create({
    data: {
      provider: provider ?? null,
      status: "RUNNING",
    },
    select: {
      id: true,
    },
  });
}

export async function finishSyncRunSuccess(
  syncRunId: string,
  counts?: {
    titlesCreated?: number;
    titlesUpdated?: number;
  },
) {
  return prisma.syncRun.update({
    where: {
      id: syncRunId,
    },
    data: {
      status: "SUCCESS",
      finishedAt: new Date(),
      titlesCreated: counts?.titlesCreated ?? 0,
      titlesUpdated: counts?.titlesUpdated ?? 0,
      errorMessage: null,
    },
  });
}

export async function finishSyncRunFailure(syncRunId: string, error: unknown) {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown sync error";

  return prisma.syncRun.update({
    where: {
      id: syncRunId,
    },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      errorMessage,
    },
  });
}

export async function runDailySyncOnce(
  task: () => Promise<SyncTaskResult>,
  provider?: ExternalTitleProvider,
) {
  await markStaleSyncRunsAsFailed(provider);

  const alreadySynced = await hasSuccessfulSyncToday(provider);

  if (alreadySynced) {
    return {
      skipped: true,
      reason: "already_synced_today" as const,
    };
  }

  const syncRun = await startSyncRun(provider);

  try {
    const result = await task();

    await finishSyncRunSuccess(syncRun.id, result);

    return {
      skipped: false,
      syncRunId: syncRun.id,
      ...result,
    };
  } catch (error) {
    await finishSyncRunFailure(syncRun.id, error);
    throw error;
  }
}

export async function markStaleSyncRunsAsFailed(
  provider?: ExternalTitleProvider,
) {
  const staleBefore = new Date(Date.now() - 1000 * 60 * 60);

  return prisma.syncRun.updateMany({
    where: {
      provider: provider ?? null,
      status: "RUNNING",
      startedAt: {
        lt: staleBefore,
      },
    },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      errorMessage: "Sync run marked as stale after 1 hour",
    },
  });
}
