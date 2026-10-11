import { AsyncLocalStorage } from "node:async_hooks";

// Only Next's request context/cache side effects are replaced, not auth or queries.
export const requests = new AsyncLocalStorage();
export async function cookies() {
  const request = requests.getStore();
  if (!request) throw new Error("Test action requires an explicit request context.");
  return {
    get: (name) => name === "session" && request.session ? { value: request.session } : undefined,
  };
}
export async function headers() { return new Headers(); }
export function revalidatePath(path) { requests.getStore()?.invalidations.push(path); }
