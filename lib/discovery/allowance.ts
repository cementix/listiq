import "server-only";

import { prisma } from "@/lib/prisma";

export const FREE_DAILY_DISCOVER_LIMIT = 30;
export const DISCOVER_LIMIT_MESSAGE = `You've used today's ${FREE_DAILY_DISCOVER_LIMIT} free Discover picks. Upgrade to Pro for unlimited Discover, or come back tomorrow.`;

export type DiscoverAllowance = { unlimited: boolean; used: number; remaining: number; limit: number };

function startOfUtcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Free members get a daily number of Discover choices; Pro and demo sandboxes are unlimited. */
export async function getDiscoverAllowance(userId: string): Promise<DiscoverAllowance> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, isGuest: true } });
  const unlimited = user?.plan === "PRO" || user?.isGuest === true;
  if (unlimited) return { unlimited, used: 0, remaining: Infinity, limit: Infinity };
  const used = await prisma.userTitleDiscovery.count({
    where: { userId, lastActionAt: { gte: startOfUtcDay() } },
  });
  return { unlimited, used, remaining: Math.max(0, FREE_DAILY_DISCOVER_LIMIT - used), limit: FREE_DAILY_DISCOVER_LIMIT };
}
