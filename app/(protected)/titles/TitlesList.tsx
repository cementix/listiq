"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, LoaderCircle, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { toggleLibraryTitle } from "@/actions/title/toggleLibraryTitle";
import { TitleType } from "@/generated/prisma/enums";

import GlassCard from "@/components/custom/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TITLE_TYPE_OPTIONS: { value: TitleType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "MOVIE", label: "Movie" },
  { value: "SERIES", label: "Series" },
  { value: "ANIME", label: "Anime" },
  { value: "MANGA", label: "Manga" },
  { value: "MANHWA", label: "Manhwa" },
  { value: "BOOK", label: "Book" },
  { value: "GAME", label: "Game" },
  { value: "NOVEL", label: "Novel" },
  { value: "COMIC", label: "Comic" },
  { value: "OTHER", label: "Other" },
];

type Genre = {
  id: string;
  name: string;
  slug: string;
};

type Title = {
  id: string;
  name: string;
  slug: string;
  year: number | null;
  description: string | null;
  imageUrl: string | null;
  type: TitleType;
  genres: Genre[];
  users: {
    userId: string;
  }[];
};

type TitlesListProps = {
  titles: Title[];
  query: string;
  type: TitleType | "ALL";
};

export default function TitlesList({ titles, query, type }: TitlesListProps) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [selectedType, setSelectedType] = useState<TitleType | "ALL">(type);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const applyFilters = (nextQuery = search, nextType = selectedType) => {
    const params = new URLSearchParams();

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    }

    if (nextType !== "ALL") {
      params.set("type", nextType);
    }

    router.push(`/titles${params.toString() ? `?${params.toString()}` : ""}`);
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      applyFilters(search, selectedType);
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [search, selectedType]);

  const toggleLibrary = (titleId: string) => {
    setPendingId(titleId);

    startTransition(async () => {
      const result = await toggleLibraryTitle(titleId);

      setPendingId(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Library updated");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          <div className="relative mx-auto w-full max-w-3xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/35" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles"
              className="h-12 rounded-xl border-white/10 bg-white/5 pl-12 pr-4 text-base text-white placeholder:text-white/35"
            />
          </div>

          <div className="flex flex-nowrap justify-center gap-2 overflow-x-auto pb-1">
            {TITLE_TYPE_OPTIONS.map((option) => {
              const active = selectedType === option.value;

              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedType(option.value)}
                  className={
                    active
                      ? "h-8 shrink-0 rounded-full border-white bg-white px-3 text-xs text-black hover:bg-white/90"
                      : "h-8 shrink-0 rounded-full border-white/10 bg-white/5 px-3 text-xs text-white hover:bg-white/10"
                  }
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {titles.length === 0 ? (
        <GlassCard className="p-6 text-white/60">No titles found.</GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {titles.map((title) => {
            const isInLibrary = title.users.length > 0;
            const isItemPending = isPending && pendingId === title.id;

            return (
              <GlassCard key={title.id} className="overflow-hidden p-0">
                <div className="relative aspect-[4/3] border-b border-white/10 bg-black/30">
                  {title.imageUrl ? (
                    <Image
                      src={title.imageUrl}
                      alt={title.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white/40">
                      no image
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-white">
                        {title.name}
                      </h2>
                      <p className="mt-1 text-sm text-white/50">
                        {title.type}
                        {title.year ? ` . ${title.year}` : ""}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => toggleLibrary(title.id)}
                      disabled={isPending}
                      className={
                        isInLibrary
                          ? "h-9 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                          : "h-9 bg-white text-black hover:bg-white/90"
                      }
                    >
                      {isItemPending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : isInLibrary ? (
                        <Check className="size-4" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </Button>
                  </div>

                  {title.description && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-white/60">
                      {title.description}
                    </p>
                  )}

                  {title.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {title.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-white/70"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
