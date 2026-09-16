export type SyncResult = {
  titlesCreated: number;
  titlesUpdated: number;
};

type SyncProgress = {
  label: string;
  detail?: string;
  titlesCreated: number;
  titlesUpdated: number;
  updatedAt: Date;
};

let syncProgress: SyncProgress = {
  label: "idle",
  titlesCreated: 0,
  titlesUpdated: 0,
  updatedAt: new Date(),
};

export function setSyncProgress(
  label: string,
  detail?: string,
  counts?: Partial<Pick<SyncProgress, "titlesCreated" | "titlesUpdated">>,
) {
  syncProgress = {
    label,
    detail,
    titlesCreated: counts?.titlesCreated ?? syncProgress.titlesCreated,
    titlesUpdated: counts?.titlesUpdated ?? syncProgress.titlesUpdated,
    updatedAt: new Date(),
  };
}

export function getSyncProgressSnapshot() {
  return {
    ...syncProgress,
  };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRetryDelayMs(response: Response, attempt: number) {
  const retryAfter = Number(response.headers.get("retry-after"));

  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }

  return Math.min(1000 * 2 ** attempt, 60_000);
}

export async function runSyncStep(
  label: string,
  task: () => Promise<SyncResult>,
) {
  setSyncProgress(label, "started");

  try {
    const result = await task();
    setSyncProgress(label, "finished", result);

    return {
      label,
      ok: true as const,
      ...result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown sync error";

    console.error(`[sync:${label}] ${errorMessage}`);
    setSyncProgress(label, `failed: ${errorMessage}`);

    return {
      label,
      ok: false as const,
      titlesCreated: 0,
      titlesUpdated: 0,
      errorMessage,
    };
  }
}

export function sumSyncResults(
  results: { titlesCreated: number; titlesUpdated: number }[],
) {
  return {
    titlesCreated: results.reduce(
      (sum, result) => sum + result.titlesCreated,
      0,
    ),
    titlesUpdated: results.reduce(
      (sum, result) => sum + result.titlesUpdated,
      0,
    ),
  };
}
