type Run = { status: string; startedAt: Date; heartbeatAt: Date; finishedAt: Date | null };

export function evaluateSyncHealth(latest: Run | null, lastSuccessAt: Date | null, now = new Date()) {
  if (!latest) return { ok: false, reason: "never_started" };
  if (latest.status === "RUNNING") {
    if (now.getTime() - latest.heartbeatAt.getTime() > 2 * 60 * 60_000) return { ok: false, reason: "heartbeat_expired" };
    if (now.getTime() - latest.startedAt.getTime() > 6 * 60 * 60_000) return { ok: false, reason: "run_too_long" };
    return { ok: true, reason: "running" };
  }
  if (latest.status === "FAILED") return { ok: false, reason: "latest_run_failed" };
  if (!lastSuccessAt || now.getTime() - lastSuccessAt.getTime() > 36 * 60 * 60_000) return { ok: false, reason: "success_overdue" };
  return { ok: true, reason: "healthy" };
}
