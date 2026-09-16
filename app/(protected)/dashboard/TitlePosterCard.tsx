import Link from "next/link";
import type { CSSProperties } from "react";

import type { DashboardTitle } from "./dashboardTypes";
import { formatTitleMeta, getTitleStats } from "./dashboardUtils";
import Image from "next/image";

type TitlePosterCardProps = {
  title: DashboardTitle;
  index?: number;
};

export default function TitlePosterCard({
  title,
  index = 0,
}: TitlePosterCardProps) {
  const stats = getTitleStats(title);

  return (
    <Link
      href={`/titles/${title.slug}`}
      style={{ animationDelay: `${160 + index * 45}ms` } as CSSProperties}
      className="dashboard-card-pop-in group block w-38 shrink-0 sm:w-42"
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

        <p className="mt-0.5 truncate text-sm text-white/45">
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
