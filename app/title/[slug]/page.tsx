import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageSquare, Star, Users } from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import DemoButton from "@/components/landing/DemoButton";
import { MotionProvider } from "@/components/landing/primitives";
import { Footer } from "@/components/landing/Sections";
import TitleSourceLinks from "@/components/custom/TitleSourceLinks";
import { getSession } from "@/lib/session";
import { getPublicTitle } from "@/lib/title/getPublicTitle";

type Props = { params: Promise<{ slug: string }> };

const TYPE_LABEL: Record<string, string> = {
  MOVIE: "Movie", SERIES: "Series", ANIME: "Anime", MANGA: "Manga", MANHWA: "Manhwa",
  BOOK: "Book", GAME: "Game", NOVEL: "Novel", COMIC: "Comic", OTHER: "Title",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const title = await getPublicTitle((await params).slug);
  if (!title) notFound();
  const name = title.year ? `${title.name} (${title.year})` : title.name;
  const description = title.description?.slice(0, 160) ?? `${name} on Listiq — ratings, reviews and lists.`;
  return {
    title: name,
    description,
    alternates: { canonical: `/title/${title.slug}` },
    openGraph: { title: name, description, images: title.imageUrl ? [{ url: title.imageUrl }] : undefined },
  };
}

export default async function PublicTitlePage({ params }: Props) {
  const { slug } = await params;
  // Members get the full interactive page.
  if (await getSession()) redirect(`/titles/${slug}`);

  const title = await getPublicTitle(slug);
  if (!title) notFound();
  const hero = title.backdropUrl ?? title.imageUrl;
  const average = title.stats.averageRating;

  return (
    <MotionProvider>
      <div className="relative min-h-screen overflow-x-clip bg-black text-white">
        <LandingNav />
        {hero && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] overflow-hidden">
            <Image src={hero} alt="" fill priority sizes="100vw" className="animate-kenburns object-cover opacity-50 blur-xl saturate-150" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />
          </div>
        )}

        <main className="relative mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">
            <ArrowLeft className="size-4" /> Listiq
          </Link>

          <div className="mt-6 grid gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
            <div className="relative mx-auto aspect-[2/3] w-full max-w-64 overflow-hidden rounded-3xl bg-white/5 shadow-[0_40px_100px_-30px_rgba(0,0,0,1)] ring-1 ring-white/15 animate-in fade-in zoom-in-95 duration-700 md:max-w-none">
              {title.imageUrl && <Image src={title.imageUrl} alt={title.name} fill priority sizes="280px" className="object-cover" />}
            </div>

            <div className="min-w-0 animate-in fade-in slide-in-from-bottom-3 duration-700">
              <p className="text-sm text-violet-300">{TYPE_LABEL[title.type] ?? title.type}{title.year ? ` · ${title.year}` : ""}</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{title.name}</h1>
              {title.genres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {title.genres.map((genre) => (
                    <span key={genre.id} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/75">{genre.name}</span>
                  ))}
                </div>
              )}
              {title.description && <p className="mt-6 max-w-2xl text-pretty leading-relaxed text-white/70">{title.description}</p>}
              <TitleSourceLinks sources={title.externalTitles} />

              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                {[
                  { icon: Star, value: average ? average.toFixed(1) : "—", label: average ? `${title.stats.ratingCount} ratings` : "No ratings yet" },
                  { icon: Users, value: String(title.stats.libraryCount), label: "In libraries" },
                  { icon: MessageSquare, value: String(title.stats.reviewCount), label: "Reviews" },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
                    <Icon className="size-4 text-violet-300" />
                    <p className="mt-2 text-2xl font-semibold">{value}</p>
                    <p className="text-xs text-white/45">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-violet-400/25 bg-gradient-to-r from-violet-500/15 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Track {title.name} on Listiq</p>
                  <p className="text-sm text-white/55">Rate it, review it and keep it alongside everything else you love.</p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <DemoButton label="Try the live demo" />
                  <Link href="/register" className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">or create a free account</Link>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-16">
            <h2 className="text-2xl font-semibold tracking-tight">What members say</h2>
            {title.reviews.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {title.reviews.map((review) => (
                  <article key={review.username} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400/50 to-violet-500/50 text-xs">{review.username.slice(0, 1).toUpperCase()}</span>
                        @{review.username}
                      </p>
                      {review.rating !== null && <span className="text-sm font-semibold text-violet-300">{review.rating.toFixed(1)}/10</span>}
                    </div>
                    <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-white/70">{review.note}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-white/50">No public reviews yet — be the first to write one.</p>
            )}
          </section>
        </main>
        <Footer year={new Date().getFullYear()} />
      </div>
    </MotionProvider>
  );
}
