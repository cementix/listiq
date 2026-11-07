import "server-only";
import { logError } from "./errors";

async function sendTelegram(event: ReturnType<typeof logError>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token && !chatId) return;
  if (!token || !chatId) {
    logError("monitoring.telegram.configuration");
    return;
  }
  try {
    const environment = process.env.VERCEL_ENV === "production" ? "production"
      : process.env.VERCEL_ENV === "preview" ? "preview" : "local";
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Listiq [${environment}]\n${event.operation}\n${event.category}\n${event.at}`,
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(5000),
      redirect: "error",
    });
    if (!response.ok) {
      await response.body?.cancel();
      logError("monitoring.telegram.delivery");
      return;
    }
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
      logError("monitoring.telegram.delivery");
    }
  } catch { logError("monitoring.telegram.delivery"); }
}

async function sendWebhook(event: ReturnType<typeof logError>) {
  const endpoint = process.env.MONITORING_WEBHOOK_URL;
  if (!endpoint) return;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") throw new Error("HTTPS required");
    const response = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application: "listiq", ...event }),
      signal: AbortSignal.timeout(5000), redirect: "error",
    });
    await response.body?.cancel();
    if (!response.ok) logError("monitoring.delivery");
  } catch { logError("monitoring.delivery"); }
}

export async function reportError(operation: string, error?: unknown) {
  const event = logError(operation, error);
  await Promise.all([sendWebhook(event), sendTelegram(event)]);
}
