import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Dice5, Flame, Star } from "lucide-react";

import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import DashboardToast from "./DashboardToast";
import { cookies } from "next/headers";
import { TitleType } from "@/generated/prisma/enums";
import DashboardRail from "./DashboardRail";

type DashboardTitle = {
  id: string;
  name: string;
  slug: string;
  type: TitleType;
  year: number | null;
  description: string | null;
  imageUrl: string | null;
  backdropUrl: string | null;
  releaseDate: Date | null;
  genres: {
    id: string;
    name: string;
    slug: string;
  }[];
  users: {
    rating: number | null;
    note: string | null;
  }[];
};

function getTitleStats(title: DashboardTitle) {
  const ratings = title.users
    .map((entry) => entry.rating)
    .filter((rating): rating is number => rating !== null);

  return {
    libraryCount: title.users.length,
    reviewCount: title.users.filter((entry) => entry.note).length,
    ratingCount: ratings.length,
    averageRating:
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null,
  };
}

function formatTitleMeta(title: DashboardTitle) {
  return [title.type, title.year].filter(Boolean).join(" • ");
}

async function getDashboardTitles() {
  const baseInclude = {
    genres: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 4,
    },
    users: {
      select: {
        rating: true,
        note: true,
      },
    },
  };

  const [
    heroCandidates,
    randomTitles,
    popularTitles,
    newReleases,
    games,
    anime,
    manga,
    topRatedPool,
    books,
  ] = await Promise.all([
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        backdropUrl: { not: null },
        description: { not: null },
        type: { not: "BOOK" },
      },
      include: baseInclude,
      orderBy: [{ users: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 12,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
      },
      include: baseInclude,
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
      },
      include: baseInclude,
      orderBy: [{ users: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        releaseDate: { not: null },
      },
      include: baseInclude,
      orderBy: [{ releaseDate: "desc" }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: "GAME",
      },
      include: baseInclude,
      orderBy: [{ users: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: "ANIME",
      },
      include: baseInclude,
      orderBy: [{ users: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: { in: ["MANGA", "MANHWA", "NOVEL"] },
      },
      include: baseInclude,
      orderBy: [{ users: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 18,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
      },
      include: baseInclude,
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
    prisma.title.findMany({
      where: {
        imageUrl: { not: null },
        type: "BOOK",
        year: { gte: 1980 },
      },
      include: baseInclude,
      orderBy: [{ updatedAt: "desc" }],
      take: 18,
    }),
  ]);

  const heroPool = heroCandidates.length > 0 ? heroCandidates : popularTitles;

  const hero =
    heroPool.length > 0
      ? heroPool[Math.floor(Math.random() * Math.min(heroPool.length, 12))]
      : (randomTitles[0] ?? null);

  const randomSideTitles = [...randomTitles]
    .sort(() => Math.random() - 0.5)
    .filter((title) => title.id !== hero?.id)
    .slice(0, 4);

  const topRated = topRatedPool
    .map((title) => ({
      title,
      stats: getTitleStats(title),
    }))
    .filter((item) => item.stats.ratingCount >= 2)
    .sort((a, b) => {
      return (
        (b.stats.averageRating ?? 0) - (a.stats.averageRating ?? 0) ||
        b.stats.ratingCount - a.stats.ratingCount
      );
    })
    .slice(0, 18)
    .map((item) => item.title);

  const optionalRails = [
    {
      title: "Games",
      href: "/titles?type=GAME&sort=popular",
      icon: "dice" as const,
      titles: games,
    },
    {
      title: "Anime",
      href: "/titles?type=ANIME&sort=popular",
      icon: "star" as const,
      titles: anime,
    },
    {
      title: "Manga, manhwa & novels",
      href: "/titles?type=MANGA&sort=popular",
      icon: "star" as const,
      titles: manga,
    },
    {
      title: "Top rated",
      href: "/titles?sort=highest-rated",
      icon: "star" as const,
      titles: topRated,
    },
    {
      title: "Books",
      href: "/titles?type=BOOK&sort=newest",
      icon: "star" as const,
      titles: books,
    },
  ].sort(() => Math.random() - 0.5);

  return {
    hero,
    randomSideTitles,
    rails: [
      {
        title: "Popular now",
        href: "/titles?sort=popular",
        icon: "flame" as const,
        titles: popularTitles,
      },
      {
        title: "New releases",
        href: "/titles?sort=newest",
        icon: "calendar" as const,
        titles: newReleases,
      },
      ...optionalRails.slice(0, 3),
    ].filter((rail) => rail.titles.length > 0),
  };
}

function TitlePosterCard({ title }: { title: DashboardTitle }) {
  const stats = getTitleStats(title);

  return (
    <Link
      href={`/titles/${title.slug}`}
      className="group block w-38 shrink-0 sm:w-42"
    >
      <div className="relative aspect-[460/649] overflow-hidden rounded-lg border border-white/10 bg-white/5">
        {title.imageUrl ? (
          <Image
            src={title.imageUrl}
            alt={title.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="180px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/40">
            no image
          </div>
        )}
      </div>

      <div className="mt-2 min-w-0">
        <p className="truncate text-sm font-medium text-white group-hover:text-primary">
          {title.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/45">
          {formatTitleMeta(title)}
        </p>
        <p className="mt-1 text-xs text-white/45">
          {stats.averageRating
            ? `${stats.averageRating.toFixed(1)} ★`
            : "No rating"}
        </p>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const cookieStore = await cookies();
  const flash = cookieStore.get("flash")?.value ?? null;
  const { hero, randomSideTitles, rails } = await getDashboardTitles();

  return (
    <>
      <DashboardToast flash={flash} />

      <PageSection className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">
        {!hero ? (
          <GlassCard className="p-6">
            <p className="text-sm text-white/50">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold">
              Welcome back, {session?.username}
            </h1>
            <p className="mt-3 max-w-xl text-white/70">
              No titles yet. Run the title sync to fill the dashboard.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Link
              href={`/titles/${hero.slug}`}
              className="group relative min-h-[420px] overflow-hidden rounded-xl border border-white/10 bg-black"
            >
              {hero.backdropUrl || hero.imageUrl ? (
                <Image
                  src={hero.backdropUrl ?? hero.imageUrl ?? ""}
                  alt={hero.name}
                  fill
                  priority
                  className="object-cover opacity-65 transition duration-500 group-hover:scale-[1.02]"
                  sizes="(min-width: 1280px) 1100px, 100vw"
                  unoptimized
                />
              ) : null}

              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-sm font-medium text-primary">
                  Featured title
                </p>

                <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">
                  {hero.name}
                </h1>

                <p className="mt-3 text-sm text-white/60">
                  {formatTitleMeta(hero)}
                </p>

                {hero.description && (
                  <p className="mt-4 max-w-2xl line-clamp-3 text-sm leading-6 text-white/70">
                    {hero.description}
                  </p>
                )}

                {hero.genres.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {hero.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/75"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>

            <GlassCard className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white">Random picks</p>
                <Dice5 className="size-4 text-white/45" />
              </div>

              <div className="grid gap-3">
                {randomSideTitles.map((title) => (
                  <Link
                    key={title.id}
                    href={`/titles/${title.slug}`}
                    className="group grid grid-cols-[56px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2 transition hover:bg-white/[0.07]"
                  >
                    <div className="relative aspect-[460/649] overflow-hidden rounded-md bg-black/40">
                      {title.imageUrl ? (
                        <Image
                          src={title.imageUrl}
                          alt={title.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 py-1">
                      <p className="truncate text-sm font-medium text-white group-hover:text-primary">
                        {title.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-white/45">
                        {formatTitleMeta(title)}
                      </p>
                      {title.genres[0] && (
                        <p className="mt-2 truncate text-xs text-white/35">
                          {title.genres[0].name}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        <div className="space-y-8">
          {rails.map((rail) => (
            <DashboardRail
              key={rail.title}
              title={rail.title}
              href={rail.href}
              icon={rail.icon}
            >
              {rail.titles.map((title) => (
                <TitlePosterCard key={title.id} title={title} />
              ))}
            </DashboardRail>
          ))}
        </div>
      </PageSection>
    </>
  );
}
