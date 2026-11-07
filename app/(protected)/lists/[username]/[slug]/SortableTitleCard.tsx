"use client";

import TitleSourceLinks from "@/components/custom/TitleSourceLinks";
import type { CatalogSourceLink } from "@/lib/catalog/attribution";

import Image from "next/image";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/react/sortable";
import { Button } from "@/components/ui/button";

export type SortableListItem = {
  id: string;
  title: {
    externalTitles?: CatalogSourceLink[];
    name: string;
    slug: string;
    imageUrl: string | null;
    type: string;
    year: number | null;
  };
  currentUserTitle: { rating: number | null } | null;
};

type Props = {
  item: SortableListItem;
  index: number;
  canReorder: boolean;
};

export default function SortableTitleCard({ item, index, canReorder }: Props) {
  const { ref, handleRef, isDragging } = useSortable({
    id: item.id,
    index,
    disabled: !canReorder,
  });

  return (
    <li
      ref={ref}
      className={`relative min-w-0 ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      <Link
        href={`/titles/${item.title.slug}`}
        className="group block select-none"
      >
        <div className="relative aspect-[460/649] overflow-hidden rounded-lg border border-white/10 bg-white/5">
          {item.title.imageUrl ? (
            <Image
              src={item.title.imageUrl}
              alt={item.title.name}
              fill
              sizes="(max-width: 640px) 50vw, 220px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-white/40">
              No image
            </div>
          )}

          <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-xs">
            {index + 1}
          </span>
        </div>

        <h3 className="mt-2 truncate text-sm font-medium text-white group-hover:text-primary">
          {item.title.name}
        </h3>
        <p className="mt-1 text-xs text-white/45">
          {item.title.type}
          {item.title.year ? ` · ${item.title.year}` : ""}
        </p>
        <p className="mt-1 text-xs text-white/65">
          {item.currentUserTitle
            ? item.currentUserTitle.rating !== null
              ? `In library · ${item.currentUserTitle.rating.toFixed(1)}/10`
              : "In library"
            : "Not in your library"}
        </p>
      </Link>
      <TitleSourceLinks sources={item.title.externalTitles} />
      {canReorder && (
        <Button
          ref={handleRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${item.title.name}`}
          title="Drag to reorder"
          className="absolute right-2 top-2 z-20 touch-none cursor-grab bg-black/75 text-white/70 hover:bg-black/90 hover:text-white active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </Button>
      )}
    </li>
  );
}
