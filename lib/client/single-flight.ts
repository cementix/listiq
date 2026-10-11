/** Ignore repeated calls until the current operation settles, including failures. */
export function createSingleFlight() {
  let running = false;

  return async function run<T>(operation: () => Promise<T>): Promise<T | undefined> {
    if (running) return;
    running = true;
    try {
      return await operation();
    } finally {
      running = false;
    }
  };
}
