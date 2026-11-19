import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";
import { getSitemapTitles } from "@/lib/title/getPublicTitle";
import { getSitemapLists } from "@/lib/title-list/getPublicListPage";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [titles, lists] = await Promise.all([getSitemapTitles().catch(() => []), getSitemapLists().catch(() => [])]);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/credits`, changeFrequency: "yearly", priority: 0.2 },
    ...lists.map((list) => ({ url: `${base}/list/${list.user.username}/${list.slug}`, lastModified: list.updatedAt, changeFrequency: "weekly" as const, priority: 0.4 })),
    ...titles.map((title) => ({ url: `${base}/title/${title.slug}`, lastModified: title.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
