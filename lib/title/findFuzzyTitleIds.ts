import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { normalizeTitleAlias } from "@/lib/sync/titleAliases";

export async function findFuzzyTitleIds(
  query: string,
  type: TitleType | "ALL",
  skip: number,
  take: number,
): Promise<string[]> {
  const text = query.trim();
  const normalized = normalizeTitleAlias(text);
  if (!normalized) return [];

  const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");
  const namePattern = `%${escapeLike(text)}%`;
  const aliasPattern = `%${escapeLike(normalized)}%`;

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    WITH alias_matches AS (
      SELECT
        a."titleId",
        MAX(similarity(a."normalizedValue", ${normalized})) AS score,
        BOOL_OR(a."normalizedValue" ILIKE ${aliasPattern}) AS contains_query
      FROM "TitleAlias" a
      WHERE a."normalizedValue" % ${normalized}
         OR a."normalizedValue" ILIKE ${aliasPattern}
      GROUP BY a."titleId"
    )
    SELECT t."id"
    FROM "Title" t
    LEFT JOIN alias_matches a ON a."titleId" = t."id"
    WHERE (
      t."name" % ${text}
      OR t."name" ILIKE ${namePattern}
      OR a."titleId" IS NOT NULL
    )
    ${
      type === "ALL"
        ? Prisma.empty
        : Prisma.sql`AND t."type" = ${type}::"TitleType"`
    }
    ORDER BY
      CASE
        WHEN LOWER(t."name") = LOWER(${text}) THEN 0
        WHEN t."name" ILIKE ${namePattern} THEN 1
        WHEN a.contains_query THEN 2
        ELSE 3
      END,
      GREATEST(
        similarity(t."name", ${text}),
        COALESCE(a.score, 0)
      ) DESC,
      t."createdAt" DESC,
      t."id"
    LIMIT ${take} OFFSET ${skip}
  `);

  return rows.map((row) => row.id);
}
