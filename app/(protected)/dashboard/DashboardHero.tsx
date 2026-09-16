import Image from "next/image";
import Link from "next/link";

import type { DashboardTitle } from "./dashboardTypes";
import { formatTitleMeta } from "./dashboardUtils";

type DashboardHeroProps = {
  title: DashboardTitle;
};

export default function DashboardHero({ title }: DashboardHeroProps) {
  const heroImage = title.backdropUrl ?? title.imageUrl;

  return (
    <Link
      href={`/titles/${title.slug}`}
      className="group relative min-h-[420px] overflow-hidden rounded-xl border border-white/10 bg-black/95 animate-in fade-in slide-in-from-left-6 duration-700"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(139,92,246,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015)_42%,rgba(0,0,0,0.55))]" />

      {heroImage ? (
        <Image
          src={heroImage}
          alt={title.name}
          fill
          priority
          className="scale-105 object-cover opacity-35 blur-sm transition duration-500 group-hover:scale-110"
          sizes="(min-width: 1280px) 1100px, 100vw"
          unoptimized
        />
      ) : null}

      {title.imageUrl ? (
        <div className="absolute right-6 z-100 top-1/2 hidden aspect-[460/649] h-[78%] -translate-y-1/2 overflow-hidden rounded-xl border border-white/20 bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.72),0_0_0_1px_rgba(255,255,255,0.08)] transition duration-500 group-hover:scale-[1.025] group-hover:border-white/35 group-hover:shadow-[0_28px_90px_rgba(0,0,0,0.78),0_0_32px_rgba(139,92,246,0.18)] lg:block xl:right-8">
          <Image
            src={title.imageUrl}
            alt={title.name}
            fill
            className="object-cover brightness-110 contrast-105 saturate-110"
            sizes="320px"
            unoptimized
          />
        </div>
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/78 via-58% to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      <div className="absolute inset-x-0 bottom-0 p-6 pr-6 sm:p-8 lg:pr-[360px] xl:pr-[420px]">
        <p
          className="dashboard-text-in text-sm font-medium text-primary"
          style={{ animationDelay: "360ms" }}
        >
          Featured title
        </p>

        <h1
          className="dashboard-text-in mt-2 max-w-3xl text-4xl font-semibold text-white sm:text-5xl"
          style={{ animationDelay: "460ms" }}
        >
          {title.name}
        </h1>

        <p
          className="dashboard-text-in mt-3 text-sm text-white/60"
          style={{ animationDelay: "560ms" }}
        >
          {formatTitleMeta(title)}
        </p>

        {title.description && (
          <p
            className="dashboard-text-in mt-4 max-w-2xl line-clamp-3 text-sm leading-6 text-white/70"
            style={{ animationDelay: "700ms" }}
          >
            {title.description}
          </p>
        )}

        {title.genres.length > 0 && (
          <div
            className="dashboard-text-in mt-5 flex flex-wrap gap-2"
            style={{ animationDelay: "840ms" }}
          >
            {title.genres.map((genre) => (
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
  );
}
