import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/title/slugify";
import { providerRequest } from "../providerRequest";
import { normalizeTitleAlias } from "../titleAliases";

export type MangaUpdatesSeries = {
  series_id: number;
  title: string;
  url: string;
  type: string;
  description?: string;
  year?: string;
  image?: { url?: { original?: string } };
  bayesian_rating?: number;
  rating_votes?: number;
  associated?: { title: string }[];
  genres?: { genre: string }[];
};

export function mapMangaUpdatesSeries(record: MangaUpdatesSeries) {
  const type = record.type === "Manga" ? "MANGA" as const : record.type === "Manhwa" ? "MANHWA" as const : null;
  const name = record.title?.trim();
  if (!type || !name || !slugify(name) || !Number.isSafeInteger(record.series_id) || record.series_id <= 0) return null;
  try {
    const source = new URL(record.url);
    if (source.protocol !== "https:" || !["mangaupdates.com", "www.mangaupdates.com"].includes(source.hostname) || source.username || source.password) return null;
  } catch { return null; }
  const parsedYear = Number(record.year?.match(/^\d{4}/)?.[0]);
  const year = Number.isInteger(parsedYear) && parsedYear >= 1000 && parsedYear <= 2200 ? parsedYear : null;
  return {
    externalId: String(record.series_id), name, type, imageUrl: null,
    externalUrl: record.url, year,
    description: null,
    genres: [...new Map((record.genres ?? []).map(({ genre }) => [slugify(genre), genre.trim()])).entries()]
      .filter(([slug, name]) => slug && name).map(([slug, name]) => ({ slug, name })),
  };
}

async function saveSeries(record: MangaUpdatesSeries) {
  const mapped = mapMangaUpdatesSeries(record);
  if (!mapped) return "skipped";
  const { externalId, externalUrl, genres, ...data } = mapped;
  // Stable provider-based slug avoids cross-provider slug races. All related
  // writes are atomic; a retry cannot leave a title without its source record.
  return prisma.$transaction(async tx => {
    const existing = await tx.externalTitle.findUnique({
      where: { provider_externalId: { provider: "MANGA_UPDATES", externalId } }, select: { titleId: true },
    });
    const genreRows = [];
    for (const genre of genres) genreRows.push(await tx.genre.upsert({ where: { slug: genre.slug }, create: genre, update: {} }));
    const title = await tx.title.upsert({
      where: existing ? { id: existing.titleId } : { slug: `mu-${externalId}-${slugify(data.name)}` },
      create: { ...data, slug: `mu-${externalId}-${slugify(data.name)}`, genres: { connect: genreRows.map(({ id }) => ({ id })) } },
      update: { name: data.name, type: data.type, year: data.year, genres: { set: genreRows.map(({ id }) => ({ id })) } },
    });
    const rawData = { bayesian_rating: record.bayesian_rating ?? null, rating_votes: record.rating_votes ?? null };
    await tx.externalTitle.upsert({
      where: { provider_externalId: { provider: "MANGA_UPDATES", externalId } },
      create: { provider: "MANGA_UPDATES", externalId, titleId: title.id, externalUrl, rawData, lastSyncedAt: new Date() },
      update: { externalUrl, rawData, lastSyncedAt: new Date() },
    });
    const aliases = new Map([data.name, ...(record.associated ?? []).map(alias => alias.title)]
      .map(value => [normalizeTitleAlias(value), value.trim()] as const).filter(([key]) => key));
    for (const [normalizedValue, value] of aliases) {
      const kind = value === data.name ? "PRIMARY" : "SYNONYM";
      await tx.titleAlias.upsert({
        where: { titleId_normalizedValue_kind: { titleId: title.id, normalizedValue, kind } },
        create: { titleId: title.id, normalizedValue, value, kind, source: "MANGA_UPDATES" },
        update: { value, source: "MANGA_UPDATES" },
      });
    }
    return existing ? "updated" : "created";
  }, { timeout: 15_000 });
}

/** Bounded curated import: two searches, one at a time, one second apart. */
export async function syncMangaUpdatesCatalog(options: { limitPerType?: number } = {}) {
  const limit = options.limitPerType ?? 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new Error("MangaUpdates limit must be 1–25 per type");
  const counts = { titlesCreated: 0, titlesUpdated: 0 };
  for (const type of ["Manga", "Manhwa"]) {
    const response = await providerRequest("MangaUpdates", "https://api.mangaupdates.com/v1/series/search", {
      method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "Listiq/0.1" },
      body: JSON.stringify({ type: [type], orderby: "rating", page: 1, perpage: 25 }),
    });
    const data = await response.json() as { results?: { record: MangaUpdatesSeries }[] };
    if (!Array.isArray(data.results)) throw new Error("Invalid MangaUpdates response");
    for (const { record } of data.results.filter(item => item.record?.type === type).slice(0, limit)) {
      const result = await saveSeries(record);
      if (result === "created") counts.titlesCreated++;
      if (result === "updated") counts.titlesUpdated++;
    }
    if (type === "Manga") await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return counts;
}
