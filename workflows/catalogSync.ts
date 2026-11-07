import type { DailyPage } from "@/lib/sync/dailyPlan";
import { catalogTypes } from "@/lib/sync/dailyPlan";

async function importPage(runId: string, job: DailyPage) {
  "use step";
  const { RetryableError, FatalError } = await import("workflow");
  const { touchSyncRun, InactiveSyncRunError } = await import("@/lib/sync/syncRun");
  const { syncCatalogPage } = await import("@/lib/sync/syncPage");
  const { ProviderError } = await import("@/lib/sync/providerRequest");
  const { logError } = await import("@/lib/observability/errors");
  try { await touchSyncRun(runId); } catch (error) {
    if (error instanceof InactiveSyncRunError) return null;
    throw new RetryableError("Catalog database unavailable", { retryAfter: "30s" });
  }
  try {
    const result = await syncCatalogPage(job);
    await touchSyncRun(runId);
    return result;
  } catch (error) {
    const reason = error instanceof ProviderError
      ? error.quotaExhausted ? "quota" : error.status ? `http-${error.status}` : "network"
      : "unexpected";
    logError(`sync.daily.import.${job.provider}.${reason}`, error);
    if (error instanceof ProviderError && !error.retryable) throw new FatalError(`${job.provider} request rejected`);
    throw new RetryableError(`${job.provider} page unavailable`, {
      retryAfter: error instanceof ProviderError ? Math.max(30_000, error.retryAfterMs) : 30_000,
    });
  }
}

async function refreshType(runId: string, type: typeof catalogTypes[number]) {
  "use step";
  const { touchSyncRun, InactiveSyncRunError } = await import("@/lib/sync/syncRun");
  const { scoreCatalog } = await import("@/lib/catalog/scoreCatalog");
  const { RetryableError } = await import("workflow");
  try {
    await touchSyncRun(runId);
    const result = await scoreCatalog(type);
    await touchSyncRun(runId);
    return result;
  } catch (error) {
    if (error instanceof InactiveSyncRunError) return null;
    throw new RetryableError("Catalog scoring unavailable", { retryAfter: "30s" });
  }
}

async function completeRun(runId: string, failed: string[], counts: { titlesCreated: number; titlesUpdated: number }) {
  "use step";
  const { finishSyncRunSuccess, finishSyncRunFailure } = await import("@/lib/sync/syncRun");
  const { revalidateCatalogViews } = await import("@/lib/cache/revalidateViews");
  const { reportError } = await import("@/lib/observability/monitoring");
  if (failed.length) {
    await finishSyncRunFailure(runId);
    await reportError("sync.daily.failed");
  } else await finishSyncRunSuccess(runId, counts);
  revalidateCatalogViews();
  return { ok: failed.length === 0, failed, ...counts };
}

export async function catalogSyncWorkflow(runId: string, plan: DailyPage[]) {
  "use workflow";
  const failed: string[] = [];
  const counts = { titlesCreated: 0, titlesUpdated: 0 };
  for (const job of plan) {
    const section = `${job.provider}:${job.section}`;
    if (failed.includes(section)) continue;
    try {
      const result = await importPage(runId, job);
      if (result === null) return { ok: false, cancelled: true };
      counts.titlesCreated += result.titlesCreated;
      counts.titlesUpdated += result.titlesUpdated;
    } catch { failed.push(section); }
  }
  for (const type of catalogTypes) {
    try {
      if (await refreshType(runId, type) === null) return { ok: false, cancelled: true };
    } catch { failed.push(`scoring:${type}`); }
  }
  return completeRun(runId, failed, counts);
}
