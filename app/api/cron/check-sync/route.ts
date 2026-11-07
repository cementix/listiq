import { prisma } from "@/lib/prisma";
import { cronAuthorized } from "@/lib/sync/cronAuth";
import { evaluateSyncHealth } from "@/lib/sync/health";
import { reportError } from "@/lib/observability/monitoring";
import { start, getRun } from "workflow/api";
import { runtimeCheckWorkflow } from "@/workflows/runtimeCheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ ok: false }, { status: 401 });
  try {
    const probe = new URL(request.url).searchParams.get("probe");
    if (probe) {
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(probe)) return Response.json({ ok: false }, { status: 400 });
      const run = getRun(probe);
      const status = await run.status;
      return Response.json({ status, ...(status === "completed" ? { result: await run.returnValue } : {}) });
    }
    const [latest, success] = await Promise.all([
      prisma.syncRun.findFirst({ where: { provider: null }, orderBy: { startedAt: "desc" }, select: { status: true, startedAt: true, heartbeatAt: true, finishedAt: true } }),
      prisma.syncRun.findFirst({ where: { provider: null, status: "SUCCESS" }, orderBy: { finishedAt: "desc" }, select: { finishedAt: true } }),
    ]);
    const health = evaluateSyncHealth(latest, success?.finishedAt ?? null);
    if (!health.ok) await reportError(`sync.health.${health.reason}`);
    return Response.json(health, { status: health.ok ? 200 : 503 });
  } catch {
    await reportError("sync.health.database");
    return Response.json({ ok: false, reason: "database_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ ok: false }, { status: 401 });
  try {
    const run = await start(runtimeCheckWorkflow, []);
    return Response.json({ workflowRunId: run.runId }, { status: 202 });
  } catch {
    await reportError("sync.runtime.failed");
    return Response.json({ ok: false }, { status: 503 });
  }
}
