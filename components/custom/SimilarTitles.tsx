import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import type { SimilarTitle } from "@/lib/title/getSimilarTitles";
import PosterFallback from "./PosterFallback";

/** Horizontal rail of related titles; `basePath` picks the in-app or public route. */
export default function SimilarTitles({ titles, basePath }: { titles: SimilarTitle[]; basePath: "/titles" | "/title" }) {
  if (titles.length === 0) return null;
  return (
    <section aria-labelledby="similar-titles" className="min-w-0">
      <h2 id="similar-titles" className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
        <Sparkles className="size-4 text-violet-300" /> More like this
      </h2>
      <ul className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
        {titles.map((title, index) => (
          <li key={title.id} style={{ animationDelay: `${index * 40}ms` }} className="dashboard-card-pop-in w-32 shrink-0 sm:w-36">
            <Link href={`${basePath}/${title.slug}`} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-violet-400/40 group-hover:shadow-[0_20px_50px_-20px_rgba(139,92,246,0.7)]">
                {title.imageUrl ? (
                  <Image src={title.imageUrl} alt={title.name} fill sizes="144px" className="object-cover transition duration-700 group-hover:scale-105" />
                ) : (
                  <PosterFallback name={title.name} />
                )}
              </div>
              <p className="mt-2 truncate text-sm text-white/80 group-hover:text-white">{title.name}</p>
              {title.year && <p className="text-xs text-white/60">{title.year}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
