import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Credits · listiq" };

export default function CreditsPage() {
  return <main className="mx-auto max-w-3xl space-y-8 px-6 py-16 text-white">
    <Link href="/" className="text-sm text-white/60 underline underline-offset-4">Back to listiq</Link>
    <div><p className="text-sm text-white/45">listiq</p><h1 className="mt-2 text-3xl font-semibold">Catalog credits</h1><p className="mt-4 text-white/65">The catalog brings together information from these providers. Artwork and descriptions belong to their respective owners.</p></div>
    <section className="space-y-4 rounded-2xl border border-white/10 p-6">
      <a href="https://www.themoviedb.org"><Image src="/providers/tmdb.svg" alt="TMDB" width={120} height={16} unoptimized /></a>
      <p className="text-sm leading-6 text-white/70">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </section>
    <ul className="space-y-4 text-white/70">
      <li><a className="underline underline-offset-4" href="https://openlibrary.org">Open Library</a> — bibliographic records; covers belong to their rights holders.</li>
      <li><a className="underline underline-offset-4" href="https://www.wikidata.org/wiki/Wikidata:Licensing">Wikidata</a> — comic series facts under CC0. Cover artwork is not imported.</li>
      <li><a className="underline underline-offset-4" href="https://www.mangaupdates.com">MangaUpdates</a> — manga and manhwa metadata. Cover artwork belongs to its respective rights holders.</li>
      <li><a className="underline underline-offset-4" href="https://rawg.io">RAWG</a> — video game information and artwork.</li>
      <li><a className="underline underline-offset-4" href="https://books.google.com">Google Books</a> — book information and covers.</li>
      <li><a className="underline underline-offset-4" href="https://comicvine.gamespot.com">Comic Vine</a> — comic volume information and artwork.</li>
    </ul>
    <p className="text-sm text-white/50">listiq is an independent project. Provider credits do not imply endorsement.</p>
  </main>;
}
