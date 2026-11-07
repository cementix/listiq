/** Only allowlisted error categories leave the process. Never serialize errors. */
export function errorCategory(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (typeof code === "string" && /^(P\d{4}|ECONNREFUSED|ETIMEDOUT|ENOTFOUND)$/.test(code)) return code;
  if (error instanceof Error && ["AbortError", "TimeoutError", "SecurityError", "ProviderError"].includes(error.name)) return error.name;
  return "UnexpectedError";
}

export function logError(operation: string, error?: unknown) {
  // Operations are developer constants, never a URL, username or request input.
  const event = { level: "error", operation: /^[a-zA-Z0-9_.:-]{1,80}$/.test(operation) ? operation : "application", category: errorCategory(error), at: new Date().toISOString() };
  console.error(JSON.stringify(event));
  return event;
}
