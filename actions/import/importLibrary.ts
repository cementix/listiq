"use server";

import { revalidatePath } from "next/cache";

import { requireUserServer } from "@/lib/auth/guards";
import { isProUser } from "@/lib/billing/stripe";
import { assertNotGuest } from "@/lib/demo/guest";
import { matchImportRows } from "@/lib/import/matchImportRows";
import { parseLibraryCsv, type ImportSource } from "@/lib/import/parseLibraryCsv";
import { addLibraryTitle, updateLibraryTitle } from "@/lib/library/mutations";
import { logError } from "@/lib/observability/errors";
import { prisma } from "@/lib/prisma";
import { securityErrorMessage } from "@/lib/security/errors";

export type ImportResult =
  | { ok: true; source: ImportSource; total: number; added: number; updated: number; unmatched: string[]; unmatchedCount: number; skipped: number }
  | { ok: false; error: string };

const MAX_BYTES = 1024 * 1024;

export async function importLibrary(_previous: ImportResult | null, formData: FormData): Promise<ImportResult> {
  try {
    const { session } = await requireUserServer();
    await assertNotGuest(session.userId, "import a library");
    if (!(await isProUser(session.userId))) return { ok: false, error: "Imports are a Pro feature. Upgrade in Plan & billing." };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a CSV file to import." };
    if (file.size > MAX_BYTES) return { ok: false, error: "That file is larger than 1 MB." };
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") return { ok: false, error: "Only .csv files are supported." };

    const parsed = parseLibraryCsv(await file.text());
    if (parsed.rows.length === 0) return { ok: false, error: "No titles found. Make sure the file has a Name or Title column." };

    const { matches, unmatched } = await matchImportRows(parsed.rows, parsed.typeHint);

    let added = 0;
    let updated = 0;
    // Small batches keep each transaction short on serverless Postgres.
    for (let index = 0; index < matches.length; index += 50) {
      const batch = matches.slice(index, index + 50);
      await prisma.$transaction(async (tx) => {
        for (const { titleId, row } of batch) {
          const inserted = await addLibraryTitle(tx, session.userId, titleId);
          if (inserted) added++;
          if (row.rating !== null || row.note) {
            await updateLibraryTitle(tx, session.userId, titleId, {
              ...(row.rating !== null ? { rating: row.rating } : {}),
              ...(row.note ? { note: row.note } : {}),
            });
            if (!inserted) updated++;
          }
        }
      }, { timeout: 30_000 });
    }

    revalidatePath("/dashboard");
    revalidatePath("/stats");
    revalidatePath(`/users/${session.username}`);
    return {
      ok: true,
      source: parsed.source,
      total: parsed.rows.length,
      added,
      updated,
      unmatched: unmatched.slice(0, 12).map((row) => (row.year ? `${row.name} (${row.year})` : row.name)),
      unmatchedCount: unmatched.length,
      skipped: parsed.skipped,
    };
  } catch (error) {
    logError("actions.import.importLibrary", error);
    return { ok: false, error: securityErrorMessage(error, "Import failed. Please try again.") };
  }
}
