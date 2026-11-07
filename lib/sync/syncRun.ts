import "server-only";
import type { ExternalTitleProvider } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const leaseMs = 2 * 60 * 60_000;
type Counts = { titlesCreated?: number; titlesUpdated?: number };
export class InactiveSyncRunError extends Error {
  readonly name = "InactiveSyncRunError";
}

/** A transaction advisory lock makes check-and-claim atomic across instances. */
export async function claimDailySync(provider?: ExternalTitleProvider) {
  return prisma.$transaction(async tx => {
    const [lock] = await tx.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(24471, 1) AS locked`;
    if (!lock.locked) return { skipped: true as const, reason: "already_running" as const };
    const now = new Date();
    const staleBefore = new Date(now.getTime() - leaseMs);
    await tx.syncRun.updateMany({
      where: { status: "RUNNING", heartbeatAt: { lt: staleBefore } },
      data: { status: "FAILED", finishedAt: now, errorMessage: "Heartbeat expired after 2 hours" },
    });
    if (await tx.syncRun.findFirst({ where: { status: "RUNNING" }, select: { id: true } })) {
      return { skipped: true as const, reason: "already_running" as const };
    }
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    if (await tx.syncRun.findFirst({ where: { provider: provider ?? null, status: "SUCCESS", startedAt: { gte: startOfDay } }, select: { id: true } })) {
      return { skipped: true as const, reason: "already_synced_today" as const };
    }
    const run = await tx.syncRun.create({ data: { provider: provider ?? null, status: "RUNNING", heartbeatAt: now }, select: { id: true } });
    return { skipped: false as const, syncRunId: run.id };
  });
}

export async function touchSyncRun(id: string) {
  const result = await prisma.syncRun.updateMany({ where: { id, status: "RUNNING" }, data: { heartbeatAt: new Date() } });
  if (result.count !== 1) throw new InactiveSyncRunError("Sync run is no longer active");
}

export async function finishSyncRunSuccess(id: string, counts?: Counts) {
  return prisma.syncRun.updateMany({ where: { id, status: "RUNNING" }, data: {
    status: "SUCCESS", finishedAt: new Date(), heartbeatAt: new Date(),
    titlesCreated: counts?.titlesCreated ?? 0, titlesUpdated: counts?.titlesUpdated ?? 0, errorMessage: null,
  } });
}

export async function finishSyncRunFailure(id: string) {
  // Never persist exception text, provider response bodies or connection strings.
  return prisma.syncRun.updateMany({ where: { id, status: "RUNNING" }, data: {
    status: "FAILED", finishedAt: new Date(), errorMessage: "Catalog sync failed; inspect sanitized operation events",
  } });
}

export async function runDailySyncOnce(task: () => Promise<Counts>, provider?: ExternalTitleProvider) {
  const claim = await claimDailySync(provider);
  if (claim.skipped) return claim;
  const heartbeat = setInterval(() => { void touchSyncRun(claim.syncRunId).catch(() => {}); }, 60_000);
  try {
    const result = await task();
    await finishSyncRunSuccess(claim.syncRunId, result);
    return { ...claim, ...result };
  } catch (error) {
    await finishSyncRunFailure(claim.syncRunId);
    throw error;
  } finally { clearInterval(heartbeat); }
}
