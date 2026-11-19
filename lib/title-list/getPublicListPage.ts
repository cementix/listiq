import "server-only";

import { cache } from "react";

import { TitleListVisibility } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/** A public list as signed-out visitors may see it; private and system lists are never returned. */
export const getPublicListPage = cache(async (username: string, slug: string) => {
  return prisma.titleList.findFirst({
    where: {
      slug,
      visibility: TitleListVisibility.PUBLIC,
      systemType: null,
      user: { username, isGuest: false },
    },
    select: {
      title: true,
      slug: true,
      description: true,
      updatedAt: true,
      user: { select: { username: true, avatarUrl: true } },
      _count: { select: { savedBy: true, items: true } },
      items: {
        orderBy: { position: "asc" },
        take: 100,
        select: { title: { select: { id: true, name: true, slug: true, type: true, year: true, imageUrl: true } } },
      },
    },
  });
});

/** Public lists with at least one title, for the sitemap. */
export async function getSitemapLists(limit = 200) {
  return prisma.titleList.findMany({
    where: { visibility: TitleListVisibility.PUBLIC, systemType: null, user: { isGuest: false }, items: { some: {} } },
    orderBy: { updatedAt: "desc" },
    select: { slug: true, updatedAt: true, user: { select: { username: true } } },
    take: limit,
  });
}
