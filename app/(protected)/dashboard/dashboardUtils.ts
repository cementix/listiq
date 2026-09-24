import type { DashboardTitle } from "./dashboardTypes";
import { getPublicTitleStats } from "@/lib/title/getPublicTitleStats";

export function getTitleStats(title: DashboardTitle) {
  return getPublicTitleStats(title.users);
}

export function formatTitleMeta(title: DashboardTitle) {
  return [title.type, title.year].filter(Boolean).join(" | ");
}

export function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function pickRandom<T>(items: T[]) {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function pickRandomFromTop<T>(items: T[], limit = 12) {
  return pickRandom(items.slice(0, limit));
}
