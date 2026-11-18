import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Bookmark, ListOrdered } from "lucide-react";

import DemoButton from "@/components/landing/DemoButton";
import LandingNav from "@/components/landing/LandingNav";
import { MotionProvider } from "@/components/landing/primitives";
import { Footer } from "@/components/landing/Sections";
import { getSession } from "@/lib/session";
import { getPublicListPage } from "@/lib/title-list/getPublicListPage";

type Props = { params: Promise<{ username: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  const list = await getPublicListPage(username, slug);
  if (!list) notFound();
  const description = list.description ?? `${list._count.items} titles curated by @${list.user.username} on Listiq.`;
  return {
    title: `${list.title} by @${list.user.username}`,
    description,
    alternates: { canonical: `/list/${list.user.username}/${list.slug}` },
    openGraph: { title: list.title, description, images: list.items[0]?.title.imageUrl ? [{ url: list.items[0].title.imageUrl }] : undefined },
  };
}

export default async function PublicListPage({ params }: Props) {
  const { username, slug } = await params;
  if (await getSession()) redirect(`/lists/${username}/${slug}`);

  const list = await getPublicListPage(username, slug);
  if (!list) notFound();
  const covers = list.items.slice(0, 5).map((item) => item.title.imageUrl).filter((url): url is string => Boolean(url));

  return (
    <MotionProvider>
      <div className="relative min-h-screen overflow-x-clip bg-black text-white">
        <LandingNav />
        {covers[0] && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
            <Image src={covers[0]} alt="" fill priority sizes="100vw" className="animate-kenburns object-cover opacity-40 blur-2xl saturate-150" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/75 to-black" />
          </div>
        )}

        <main className="relative mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">
            <ArrowLeft className="size-4" /> Listiq
          </Link>

          <header className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-700">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300/80 uppercase"><ListOrdered className="size-3.5" />Curated list</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{list.title}</h1>
              {list.description && <p className="mt-4 text-pretty text-white/65">{list.description}</p>}
              <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/50">
                <span className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400/50 to-violet-500/50 text-xs text-white">{list.user.username.slice(0, 1).toUpperCase()}</span>
                  @{list.user.username}
                </span>
                <span>· {list._count.items} titles</span>
                <span className="flex items-center gap-1">· <Bookmark className="size-3.5" />{list._count.savedBy} saves</span>
              </p>
            </div>
            {covers.length > 0 && (
              <div aria-hidden className="relative hidden h-44 w-72 shrink-0 md:block">
                {covers.slice(0, 4).map((cover, index) => (
                  <div
                    key={cover}
                    className="absolute top-0 h-44 w-30 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 animate-in fade-in slide-in-from-right-4 duration-700"
                    style={{ left: index * 52, transform: `rotate(${(index - 1.5) * 5}deg)`, zIndex: 4 - index, animationDelay: `${index * 80}ms` }}
                  >
                    <Image src={cover} alt="" fill sizes="120px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </header>

          <ol className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {list.items.map(({ title }, index) => (
              <li key={title.id} style={{ animationDelay: `${Math.min(index, 15) * 40}ms` }} className="dashboard-card-pop-in">
                <Link href={`/title/${title.slug}`} className="group block">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-violet-400/40">
                    {title.imageUrl && <Image src={title.imageUrl} alt={title.name} fill sizes="220px" className="object-cover transition duration-700 group-hover:scale-105" />}
                    <span className="absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-black/70 text-xs font-semibold backdrop-blur">{index + 1}</span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-white/85 group-hover:text-white">{title.name}</p>
                  {title.year && <p className="text-xs text-white/40">{title.year}</p>}
                </Link>
              </li>
            ))}
          </ol>

          <div className="mt-16 flex flex-col items-center gap-3 rounded-3xl border border-violet-400/25 bg-gradient-to-r from-violet-500/15 via-transparent to-sky-500/10 p-8 text-center">
            <p className="text-xl font-semibold">Make lists like this in seconds</p>
            <p className="max-w-md text-sm text-white/55">Drag to reorder, keep them private or share them with anyone.</p>
            <DemoButton className="sm:items-center" />
          </div>
        </main>
        <Footer year={new Date().getFullYear()} />
      </div>
    </MotionProvider>
  );
}
