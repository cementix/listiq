import "server-only";

import type { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { normalizeTitleAlias } from "@/lib/sync/titleAliases";
import type { ImportRow } from "./parseLibraryCsv";

type Candidate = { id: string; type: TitleType; year: number | null; catalogScore: number | null };

/** Scores a catalog candidate for an imported row; higher is better, null rejects it. */
export function scoreCandidate(candidate: Candidate, row: ImportRow, typeHint: TitleType | null) {
  let score = (candidate.catalogScore ?? 0) / 100;
  if (row.year && candidate.year) {
    const gap = Math.abs(candidate.year - row.year);
    if (gap > 1) return null; // Same name, different work (remakes, reboots).
    score += gap === 0 ? 3 : 1.5;
  }
  if (typeHint && candidate.type === typeHint) score += 2;
  return score;
}

/** Resolves imported rows to catalog titles through the normalised alias index. */
export async function matchImportRows(rows: ImportRow[], typeHint: TitleType | null) {
  const keys = [...new Set(rows.map((row) => normalizeTitleAlias(row.name)).filter(Boolean))];
  const aliases = keys.length
    ? await prisma.titleAlias.findMany({
        where: { normalizedValue: { in: keys }, title: { catalogEligible: true } },
        select: { normalizedValue: true, title: { select: { id: true, type: true, year: true, catalogScore: true } } },
      })
    : [];

  // Many catalog titles have no alias rows yet, so also match on the primary
  // name normalised in SQL the same way normalizeTitleAlias does (minus accents).
  const named = keys.length
    ? await prisma.$queryRaw<(Candidate & { key: string })[]>`
        SELECT id, type::text AS type, year, "catalogScore", key FROM (
          SELECT id, type, year, "catalogScore",
            btrim(regexp_replace(regexp_replace(lower(replace(name, '&', ' and ')), '[^a-z0-9а-яё]+', ' ', 'g'), '[[:space:]]+', ' ', 'g')) AS key
          FROM "Title" WHERE "catalogEligible"
        ) normalized
        WHERE key = ANY(${keys})`
    : [];

  const byKey = new Map<string, Candidate[]>();
  const add = (key: string, candidate: Candidate) => {
    const list = byKey.get(key) ?? [];
    if (!list.some((item) => item.id === candidate.id)) list.push(candidate);
    byKey.set(key, list);
  };
  for (const alias of aliases) add(alias.normalizedValue, alias.title);
  for (const { key, ...candidate } of named) add(key, candidate);

  const matches: { titleId: string; row: ImportRow }[] = [];
  const unmatched: ImportRow[] = [];
  const used = new Set<string>();
  for (const row of rows) {
    const candidates = byKey.get(normalizeTitleAlias(row.name)) ?? [];
    let best: { id: string; score: number } | null = null;
    for (const candidate of candidates) {
      const score = scoreCandidate(candidate, row, typeHint);
      if (score !== null && (!best || score > best.score)) best = { id: candidate.id, score };
    }
    if (best && !used.has(best.id)) {
      used.add(best.id);
      matches.push({ titleId: best.id, row });
    } else {
      unmatched.push(row);
    }
  }
  return { matches, unmatched };
}
