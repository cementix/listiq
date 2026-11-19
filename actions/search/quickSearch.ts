"use server";

import { TitleListVisibility } from "@/generated/prisma/enums";
import { requireUserServer } from "@/lib/auth/guards";
import { logError } from "@/lib/observability/errors";
import { prisma } from "@/lib/prisma";

export type QuickSearchResult = {
  titles: { id: string; name: string; slug: string; type: string; year: number | null; imageUrl: string | null }[];
  lists: { id: string; title: string; slug: string; owner: string; count: number }[];
  people: { username: string; avatarUrl: string | null }[];
};

const EMPTY: QuickSearchResult = { titles: [], lists: [], people: [] };

/** Lightweight search for the command palette: titles, public lists and members. */
export async function quickSearch(rawQuery: string): Promise<QuickSearchResult> {
  try {
    await requireUserServer();
    const query = rawQuery.trim().slice(0, 80);
    if (query.length < 2) return EMPTY;

    const [titles, lists, people] = await Promise.all([
      prisma.title.findMany({
        where: { catalogEligible: true, name: { contains: query, mode: "insensitive" } },
        orderBy: [{ catalogScore: { sort: "desc", nulls: "last" } }, { name: "asc" }],
        select: { id: true, name: true, slug: true, type: true, year: true, imageUrl: true },
        take: 7,
      }),
      prisma.titleList.findMany({
        where: { visibility: TitleListVisibility.PUBLIC, systemType: null, title: { contains: query, mode: "insensitive" } },
        orderBy: { savedBy: { _count: "desc" } },
        select: { id: true, title: true, slug: true, user: { select: { username: true } }, _count: { select: { items: true } } },
        take: 4,
      }),
      prisma.user.findMany({
        where: { isGuest: false, username: { contains: query, mode: "insensitive" } },
        select: { username: true, avatarUrl: true },
        orderBy: { username: "asc" },
        take: 4,
      }),
    ]);

    return {
      titles,
      lists: lists.map((list) => ({ id: list.id, title: list.title, slug: list.slug, owner: list.user.username, count: list._count.items })),
      people,
    };
  } catch (error) {
    logError("actions.search.quickSearch", error);
    return EMPTY;
  }
}
