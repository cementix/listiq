export class SecurityError extends Error {}

export function securityErrorMessage(error: unknown, fallback: string) {
  return error instanceof SecurityError ? error.message : fallback;
}
