import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (error) => {
  const { reportError } = await import("./lib/observability/monitoring");
  await reportError("server.request", error);
};
