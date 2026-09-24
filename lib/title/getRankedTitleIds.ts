import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { TitleType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type TitleRank = "popular" | "highest-rated" | "most-reviewed" | "recently-added";

type RankedTitleIdsInput = {
  sort: TitleRank;
  limit: number;
  offset?: number;
  query?: string;
  aliasQuery?: string;
  type?: TitleType | "ALL";
  types?: TitleType[];
  excludeType?: TitleType;
  imageOnly?: boolean;
  minRatings?: number;
};

const orderByRank: Record<TitleRank, Prisma.Sql> = {
  popular: Prisma.sql`COUNT(ut.id) FILTER (WHERE u."libraryPublic") DESC, t."createdAt" DESC, t.id DESC`,
  "highest-rated": Prisma.sql`AVG(ut."rating") FILTER (WHERE u."reviewsPublic") DESC NULLS LAST, COUNT(ut."rating") FILTER (WHERE u."reviewsPublic") DESC, t."createdAt" DESC, t.id DESC`,
  "most-reviewed": Prisma.sql`COUNT(ut.id) FILTER (WHERE u."reviewsPublic" AND NULLIF(BTRIM(ut."note"), '') IS NOT NULL) DESC, t."createdAt" DESC, t.id DESC`,
  "recently-added": Prisma.sql`MAX(ut."createdAt") FILTER (WHERE u."libraryPublic") DESC NULLS LAST, t."createdAt" DESC, t.id DESC`,
};

export async function getRankedTitleIds({
  sort,
  limit,
  offset = 0,
  query,
  aliasQuery,
  type = "ALL",
  types,
  excludeType,
  imageOnly = false,
  minRatings = 0,
}: RankedTitleIdsInput) {
  const filters: Prisma.Sql[] = [];

  if (query) {
    filters.push(Prisma.sql`(
      t."name" ILIKE ${`%${query}%`}
      OR EXISTS (
        SELECT 1 FROM "TitleAlias" a
        WHERE a."titleId" = t.id
          AND a."normalizedValue" ILIKE ${`%${aliasQuery ?? query}%`}
      )
    )`);
  }

  if (type !== "ALL") filters.push(Prisma.sql`t."type"::text = ${type}`);
  if (types?.length) {
    filters.push(Prisma.sql`t."type"::text IN (${Prisma.join(types)})`);
  }
  if (excludeType) {
    filters.push(Prisma.sql`t."type"::text <> ${excludeType}`);
  }
  if (imageOnly) filters.push(Prisma.sql`t."imageUrl" IS NOT NULL`);

  const where = filters.length
    ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
    : Prisma.empty;
  const having = minRatings
    ? Prisma.sql`HAVING COUNT(ut."rating") FILTER (WHERE u."reviewsPublic") >= ${minRatings}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT t.id
    FROM "Title" t
    LEFT JOIN "UserTitle" ut ON ut."titleId" = t.id
    LEFT JOIN "User" u ON u.id = ut."userId"
    ${where}
    GROUP BY t.id
    ${having}
    ORDER BY ${orderByRank[sort]}
    LIMIT ${limit} OFFSET ${offset}
  `);

  return rows.map((row) => row.id);
}
