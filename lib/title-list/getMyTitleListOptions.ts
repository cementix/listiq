import { requireUserServer } from "@/lib/auth/guards";
import "server-only";
import { ensureSaveForLaterList } from "./ensureSaveForLaterList";
import { prisma } from "../prisma";

export async function getMyTitleListOptions(titleId: string) {
  const { session } = await requireUserServer();

  await ensureSaveForLaterList(session.userId);

  const lists = await prisma.titleList.findMany({
    where: {
      userId: session.userId,
    },
    select: {
      id: true,
      title: true,
      visibility: true,
      systemType: true,
      items: {
        where: {
          titleId,
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
    orderBy: [
      {
        systemType: {
          sort: "asc",
          nulls: "last",
        },
      },
      { title: "asc" },
    ],
  });

  return lists.map(({ items, ...list }) => ({
    ...list,
    containsTitle: items.length > 0,
    itemId: items[0]?.id ?? null,
  }));
}
