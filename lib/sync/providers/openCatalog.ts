import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/title/slugify";
import { normalizeTitleAlias } from "../titleAliases";
import { providerRequest } from "../providerRequest";
import type { Prisma } from "@/generated/prisma/client";

type Entry = { provider: "OPEN_LIBRARY" | "WIKIDATA"; externalId: string; name: string; type: "BOOK" | "COMIC"; externalUrl: string; imageUrl: string | null; year: number | null };
type Book = { key: string; title: string; first_publish_year?: number };

export function mapOpenLibraryBook(book: Book): Entry | null {
  if (!/^\/works\/OL\d+W$/.test(book.key) || !book.title?.trim() || !slugify(book.title)) return null;
  return {
    provider: "OPEN_LIBRARY", externalId: book.key.split("/").at(-1)!, name: book.title.trim(), type: "BOOK",
    externalUrl: `https://openlibrary.org${book.key}`,
    imageUrl: null,
    year: Number.isInteger(book.first_publish_year) && book.first_publish_year! >= 1000 && book.first_publish_year! <= 2200 ? book.first_publish_year! : null,
  };
}

export function mapWikidataComic(id: string, name: string): Entry | null {
  if (!/^Q\d+$/.test(id) || !name?.trim() || name === id || !slugify(name)) return null;
  return { provider: "WIKIDATA", externalId: id, name: name.trim(), type: "COMIC", externalUrl: `https://www.wikidata.org/wiki/${id}`, imageUrl: null, year: null };
}

async function save(entry: Entry) {
  const { provider, externalId, externalUrl, ...data } = entry;
  return prisma.$transaction(async tx => {
    const existing = await tx.externalTitle.findUnique({ where: { provider_externalId: { provider, externalId } }, select: { titleId: true } });
    const slug = `${provider.toLowerCase()}-${externalId.toLowerCase()}-${slugify(data.name)}`;
    const title = await tx.title.upsert({
      where: existing ? { id: existing.titleId } : { slug },
      create: { ...data, slug },
      update: { name: data.name, year: data.year },
    });
    // Persist only selected catalog facts, never user data or entire API envelopes.
    const rawData = { externalId, name: data.name, year: data.year } as Prisma.InputJsonValue;
    await tx.externalTitle.upsert({ where: { provider_externalId: { provider, externalId } },
      create: { provider, externalId, externalUrl, titleId: title.id, rawData, lastSyncedAt: new Date() },
      update: { externalUrl, rawData, lastSyncedAt: new Date() } });
    const normalizedValue = normalizeTitleAlias(data.name);
    if (normalizedValue) await tx.titleAlias.upsert({
      where: { titleId_normalizedValue_kind: { titleId: title.id, normalizedValue, kind: "PRIMARY" } },
      create: { titleId: title.id, value: data.name, normalizedValue, kind: "PRIMARY", source: provider }, update: { value: data.name, source: provider },
    });
    return existing ? "updated" : "created";
  });
}

/** Small human-triggered lookup, not a bulk API harvest. Use dumps for scale. */
export async function syncOpenCatalog(provider: "open-library" | "wikidata", limit = 5) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new Error("Replacement sample limit must be 1–10");
  let entries: Entry[];
  if (provider === "open-library") {
    const params = new URLSearchParams({ q: "subject:fiction", limit: String(limit), fields: "key,title,first_publish_year" });
    const contact = process.env.OPEN_LIBRARY_CONTACT?.trim();
    const response = await providerRequest("Open Library", `https://openlibrary.org/search.json?${params}`, {
      headers: { "User-Agent": contact ? `Listiq/0.1 (${contact})` : "Listiq/0.1" },
    });
    const body = await response.json() as { docs?: Book[] };
    if (!Array.isArray(body.docs)) throw new Error("Invalid Open Library response");
    entries = body.docs.slice(0, limit).flatMap(book => { const value = mapOpenLibraryBook(book); return value ? [value] : []; });
  } else {
    const query = `SELECT ?item ?itemLabel WHERE { ?item wdt:P31 wd:Q14406742 . SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT ${limit}`;
    const params = new URLSearchParams({ query, format: "json" });
    const response = await providerRequest("Wikidata", `https://query.wikidata.org/sparql?${params}`, { headers: { Accept: "application/sparql-results+json", "User-Agent": "Listiq/0.1 (noncommercial catalog prototype)" } });
    const body = await response.json() as { results?: { bindings?: { item: { value: string }; itemLabel: { value: string } }[] } };
    if (!Array.isArray(body.results?.bindings)) throw new Error("Invalid Wikidata response");
    entries = body.results.bindings.slice(0, limit).flatMap(record => {
      const id = record.item.value.match(/^https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)$/)?.[1];
      const value = id ? mapWikidataComic(id, record.itemLabel.value) : null;
      return value ? [value] : [];
    });
  }
  const counts = { titlesCreated: 0, titlesUpdated: 0 };
  for (const entry of entries) {
    if (await save(entry) === "created") counts.titlesCreated++; else counts.titlesUpdated++;
  }
  return counts;
}
