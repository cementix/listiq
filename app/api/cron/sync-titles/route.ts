import { syncTitlesDaily } from "@/lib/sync/syncTitles";
import { revalidateCatalogViews } from "@/lib/cache/revalidateViews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  let result;
  try {
    result = await syncTitlesDaily();
  } finally {
    // Successful providers remain saved even if another provider fails.
    revalidateCatalogViews();
  }

  return Response.json({
    ok: true,
    durationMs: Date.now() - startedAt,
    result,
  });
}
