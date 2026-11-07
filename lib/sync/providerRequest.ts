import { providerImportEnabled } from "./providerPolicy";
import { reserveProviderRequest } from "./providerQuota";

export class ProviderError extends Error {
  readonly name = "ProviderError";
  constructor(readonly provider: string, readonly status: number, readonly retryAfterMs = 30_000, readonly quotaExhausted = false) {
    super(`${provider} request failed ${status || "network"}`);
  }
  get retryable() { return !this.quotaExhausted && (this.status === 0 || this.status === 429 || this.status >= 500); }
}

export function retryDelay(response: Response, attempt: number, now = Date.now()) {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - now;
    if (Number.isFinite(delay) && delay > 0) return Math.min(delay, 24 * 60 * 60_000);
  }
  return Math.min(1000 * 2 ** attempt, 15_000);
}

/** Bounded to < 120s per API request including retries. Never expose URLs/bodies. */
export async function providerRequest(
  provider: string, url: string, init: RequestInit = {},
  reserve = reserveProviderRequest,
) {
  // AniList explicitly restricts competing trackers and bulk collection.
  // Keep all entry points off unless provider permission has been recorded.
  const restricted = provider === "AniList" ? "anilist"
    : provider === "Google Books" ? "google-books"
    : provider === "Comic Vine" ? "comic-vine" : null;
  if (restricted && !providerImportEnabled(restricted)) {
    throw new ProviderError(provider, 403);
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!await reserve(provider)) throw new ProviderError(provider, 429, 0, true);
    let failure: ProviderError;
    try {
      const response = await fetch(url, {
        ...init, redirect: "error",
        signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
      });
      if (response.ok) return response;
      const delay = retryDelay(response, attempt);
      await response.body?.cancel();
      failure = new ProviderError(provider, response.status, delay);
    } catch (error) {
      if (init.signal?.aborted) throw new ProviderError(provider, 0);
      failure = error instanceof ProviderError ? error : new ProviderError(provider, 0, 1000 * 2 ** attempt);
    }
    // Long Retry-After values are deferred to the durable workflow, not slept
    // inside a serverless invocation. CLI callers get an actionable failure.
    if (!failure.retryable || attempt === 3 || failure.retryAfterMs > 15_000) throw failure;
    await new Promise(resolve => setTimeout(resolve, failure.retryAfterMs));
  }
  throw new ProviderError(provider, 0);
}
