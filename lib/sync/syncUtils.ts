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
