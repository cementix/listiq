import Image from "next/image";
import Link from "next/link";
import { Dice5 } from "lucide-react";

import GlassCard from "@/components/custom/GlassCard";
import type { DashboardTitle } from "./dashboardTypes";
import { formatTitleMeta } from "./dashboardUtils";

type DashboardRandomPicksProps = {
  titles: DashboardTitle[];
};

export default function DashboardRandomPicks({
  titles,
}: DashboardRandomPicksProps) {
  return (
    <GlassCard className="dashboard-panel-in p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-white">Random picks</p>
        <Dice5 className="size-4 text-white/45" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        {titles.map((title, index) => (
          <Link
            key={title.id}
            href={`/titles/${title.slug}`}
            style={
              { animationDelay: `${560 + index * 90}ms` } as React.CSSProperties
            }
            className="dashboard-pick-in group grid min-w-0 grid-cols-[56px_minmax(0,1fr)] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2 transition hover:bg-white/[0.07]"
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
  );
}
