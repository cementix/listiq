export function assertDemoTarget(target: string, production?: string) {
  const url = new URL(target);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Demo requires PostgreSQL");
  if (production) {
    const source = new URL(production);
    const host = (value: string) => value.replace("-pooler.", ".");
    if (host(source.hostname) === host(url.hostname) && source.pathname === url.pathname) {
      throw new Error("Demo target must differ from the application database");
    }
  }
  if (!url.pathname || url.pathname === "/") throw new Error("Demo database name is required");
}
