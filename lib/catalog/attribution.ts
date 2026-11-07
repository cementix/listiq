import type { ExternalTitleProvider } from "@/generated/prisma/enums";

export type CatalogSourceLink = { provider: ExternalTitleProvider; externalId: string; externalUrl: string | null };
export const sourceLinkSelect = { provider: true, externalId: true, externalUrl: true } as const;
const providers: Record<ExternalTitleProvider, { name: string; host: string }> = {
  WIKIDATA: { name: "Wikidata", host: "wikidata.org" },
  MANGA_UPDATES: { name: "MangaUpdates", host: "mangaupdates.com" },
  TMDB_MOVIE: { name: "TMDB", host: "themoviedb.org" }, TMDB_TV: { name: "TMDB", host: "themoviedb.org" },
  RAWG: { name: "RAWG", host: "rawg.io" }, ANILIST: { name: "AniList", host: "anilist.co" },
  GOOGLE_BOOKS: { name: "Google Books", host: "books.google.com" }, COMIC_VINE: { name: "Comic Vine", host: "comicvine.gamespot.com" },
  OPEN_LIBRARY: { name: "Open Library", host: "openlibrary.org" },
};

export function catalogSourceLink(source: CatalogSourceLink) {
  const provider = providers[source.provider];
  if (!provider) return null;
  let url: URL;
  try {
    url = source.provider === "GOOGLE_BOOKS"
      ? new URL(`https://books.google.com/books?id=${encodeURIComponent(source.externalId)}`)
      : new URL(source.externalUrl || `https://${provider.host}`);
  } catch { return null; }
  if (url.protocol !== "https:" || (url.hostname !== provider.host && !url.hostname.endsWith(`.${provider.host}`))) return null;
  if (url.username || url.password) return null;
  return { label: provider.name, href: url.href };
}
