async function checkDatabase() {
  "use step";
  const { prisma } = await import("@/lib/prisma");
  const { RetryableError } = await import("workflow");
  try {
    const [row] = await prisma.$queryRaw<{ value: number }[]>`SELECT 1::int AS value`;
    return row.value === 1;
  } catch { throw new RetryableError("Database probe unavailable", { retryAfter: "10s" }); }
}

/** An authenticated operator can verify the durable runtime without importing data. */
export async function runtimeCheckWorkflow() {
  "use workflow";
  return { ok: await checkDatabase() };
}
