"use client";

import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { useActionState, useState, type DragEvent } from "react";

import { importLibrary, type ImportResult } from "@/actions/import/importLibrary";
import { cn } from "@/lib/utils";

const SOURCE_LABEL = { letterboxd: "Letterboxd", goodreads: "Goodreads", generic: "CSV" } as const;

export default function ImportForm() {
  const [result, action, pending] = useActionState<ImportResult | null, FormData>(importLibrary, null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const input = event.currentTarget.querySelector("input");
    if (input && event.dataTransfer.files.length) {
      input.files = event.dataTransfer.files;
      setFileName(event.dataTransfer.files[0].name);
    }
  };

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <label
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition",
            dragging ? "border-violet-400 bg-violet-500/10" : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]",
          )}
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-violet-500/15 text-violet-300 transition group-hover:scale-110">
            {fileName ? <FileSpreadsheet className="size-6" /> : <UploadCloud className="size-6" />}
          </span>
          <span className="text-base font-medium text-white">{fileName ?? "Drop your export here or click to browse"}</span>
          <span className="text-sm text-white/45">Letterboxd ratings/diary, Goodreads library, or any CSV with a Title column · up to 1 MB</span>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          />
        </label>
        <button
          type="submit"
          disabled={pending || !fileName}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
          {pending ? "Importing…" : "Import library"}
        </button>
      </form>

      {result && !result.ok && <p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{result.error}</p>}

      {result?.ok && (
        <div role="status" className="space-y-4 rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.06] p-5 animate-in fade-in slide-in-from-bottom-2">
          <p className="flex items-center gap-2 font-medium text-emerald-100"><CheckCircle2 className="size-5" />Imported from {SOURCE_LABEL[result.source]}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Added", value: result.added },
              { label: "Updated", value: result.updated },
              { label: "Not found", value: result.unmatchedCount },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-black/25 p-3">
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
          {result.unmatched.length > 0 && (
            <div>
              <p className="text-xs text-white/50">Not in the catalog yet{result.unmatchedCount > result.unmatched.length ? ` (showing ${result.unmatched.length} of ${result.unmatchedCount})` : ""}:</p>
              <p className="mt-1 text-sm text-white/70">{result.unmatched.join(" · ")}</p>
              <Link href="/add-title" className="mt-2 inline-block text-sm text-violet-300 underline-offset-4 hover:underline">Suggest a missing title →</Link>
            </div>
          )}
          <Link href="/stats" className="inline-flex text-sm font-medium text-white underline-offset-4 hover:underline">See your updated insights →</Link>
        </div>
      )}
    </div>
  );
}
