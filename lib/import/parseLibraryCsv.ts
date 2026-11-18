import type { TitleType } from "@/generated/prisma/enums";

export type ImportSource = "letterboxd" | "goodreads" | "generic";

export type ImportRow = {
  name: string;
  year: number | null;
  /** Normalised to Listiq's 0–10 scale in half-point steps, or null when unrated. */
  rating: number | null;
  note: string | null;
};

export type ParsedImport = {
  source: ImportSource;
  typeHint: TitleType | null;
  rows: ImportRow[];
  skipped: number;
};

export const MAX_IMPORT_ROWS = 2000;

/** RFC 4180-style CSV parsing with quoted fields, escaped quotes and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");

  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index++;
      row.push(field); field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

const pick = (headers: string[], ...names: string[]) => {
  for (const name of names) {
    const index = headers.indexOf(name);
    if (index !== -1) return index;
  }
  return -1;
};

function toYear(value: string | undefined) {
  const match = value?.match(/\b(1[89]\d{2}|20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

/** Converts a source rating to 0–10 in half steps; 5-point scales are doubled. */
export function normaliseRating(value: string | undefined, fivePointScale: boolean) {
  if (!value?.trim()) return null;
  const number = Number(value.replace(",", "."));
  if (!Number.isFinite(number) || number <= 0) return null;
  const scaled = fivePointScale ? number * 2 : number;
  return Math.min(10, Math.max(0.5, Math.round(scaled * 2) / 2));
}

export function parseLibraryCsv(text: string): ParsedImport {
  const table = parseCsv(text);
  if (table.length < 2) return { source: "generic", typeHint: null, rows: [], skipped: 0 };

  const headers = table[0].map((header) => header.trim().toLowerCase());
  const isGoodreads = headers.includes("book id") || headers.includes("my rating");
  const isLetterboxd = headers.includes("letterboxd uri");
  const source: ImportSource = isLetterboxd ? "letterboxd" : isGoodreads ? "goodreads" : "generic";

  const nameIndex = pick(headers, "name", "title", "film", "series_title", "anime title");
  const yearIndex = pick(headers, "year", "original publication year", "year published", "release year", "release date");
  const ratingIndex = pick(headers, "rating", "my rating", "score", "my score", "your rating");
  const noteIndex = pick(headers, "review", "my review", "notes", "note", "comment");
  if (nameIndex === -1) return { source, typeHint: null, rows: [], skipped: table.length - 1 };

  const body = table.slice(1, MAX_IMPORT_ROWS + 1);
  const ratings = body.map((cells) => Number((cells[ratingIndex] ?? "").replace(",", "."))).filter(Number.isFinite);
  // Letterboxd and Goodreads use 5-point scales; for generic files infer it from the data.
  const fivePoint = source !== "generic" || (ratings.length > 0 && Math.max(...ratings) <= 5);

  const rows: ImportRow[] = [];
  let skipped = table.length - 1 - body.length;
  const seen = new Set<string>();
  for (const cells of body) {
    const name = cells[nameIndex]?.trim();
    if (!name) { skipped++; continue; }
    const year = yearIndex === -1 ? null : toYear(cells[yearIndex]);
    const key = `${name.toLowerCase()}|${year ?? ""}`;
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);
    const note = noteIndex === -1 ? null : cells[noteIndex]?.trim().slice(0, 2000) || null;
    rows.push({ name: name.slice(0, 300), year, rating: ratingIndex === -1 ? null : normaliseRating(cells[ratingIndex], fivePoint), note });
  }

  const typeHint: TitleType | null = source === "letterboxd" ? "MOVIE" : source === "goodreads" ? "BOOK" : null;
  return { source, typeHint, rows, skipped };
}
