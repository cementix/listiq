import { start } from "workflow/api";
import { catalogSyncWorkflow } from "@/workflows/catalogSync";
import { claimDailySync, finishSyncRunFailure } from "@/lib/sync/syncRun";
import { cronAuthorized } from "@/lib/sync/cronAuth";
import { reportError } from "@/lib/observability/monitoring";
import { prisma } from "@/lib/prisma";
import { dailySyncPlan } from "@/lib/sync/dailyPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let runId: string | undefined;
  try {
    const claim = await claimDailySync();
    if (claim.skipped) return Response.json({ ok: true, ...claim });
    runId = claim.syncRunId;
    const run = await start(catalogSyncWorkflow, [runId, dailySyncPlan()]);
    await prisma.syncRun.updateMany({ where: { id: runId, status: "RUNNING" }, data: { workflowRunId: run.runId } });
    return Response.json({ ok: true, syncRunId: runId, workflowRunId: run.runId }, { status: 202 });
  } catch {
    if (runId) await finishSyncRunFailure(runId).catch(() => {});
    await reportError("sync.dispatch.failed");
    return Response.json({ ok: false, error: "Unable to start catalog sync" }, { status: 503 });
  }
}
