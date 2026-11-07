import Link from "next/link";

export default function ProviderCredits() {
  return <footer className="mx-auto mt-10 flex max-w-[1600px] flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/10 px-4 py-6 text-xs text-white/45">
    <span>Catalog data:</span>
    <a href="https://openlibrary.org" className="min-h-8 content-center hover:text-white">Open Library</a>
    <a href="https://www.wikidata.org" className="min-h-8 content-center hover:text-white">Wikidata · CC0</a>
    <a href="https://www.mangaupdates.com" className="min-h-8 content-center hover:text-white">MangaUpdates</a>
    <a href="https://www.themoviedb.org" className="min-h-8 content-center hover:text-white">TMDB</a>
    <a href="https://rawg.io" className="min-h-8 content-center hover:text-white">RAWG</a>
    <a href="https://books.google.com" className="min-h-8 content-center hover:text-white">Google Books</a>
    <a href="https://comicvine.gamespot.com" className="min-h-8 content-center hover:text-white">Comic Vine</a>
    <Link href="/credits" className="min-h-8 content-center underline underline-offset-4 hover:text-white">Credits</Link>
  </footer>;
}
