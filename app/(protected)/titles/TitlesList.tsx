"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Check,
  LoaderCircle,
  MessageSquare,
  Plus,
  Search,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { toggleLibraryTitle } from "@/actions/title/toggleLibraryTitle";
import { TitleType } from "@/generated/prisma/enums";

import GlassCard from "@/components/custom/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import ConfirmDialog from "@/components/custom/ConfirmDialog";
import { getTitles } from "@/actions/title/getTitles";

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

const TITLE_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "highest-rated", label: "Highest rated" },
  { value: "most-reviewed", label: "Most reviewed" },
  { value: "recently-added", label: "Recently added" },
] as const;

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
    id: string;
    userId: string;
    rating: number | null;
    note: string | null;
    createdAt: Date;
  }[];
  currentUserTitle: {
    id: string;
    userId: string;
    rating: number | null;
    note: string | null;
    createdAt: Date;
  } | null;
  stats: {
    libraryCount: number;
    ratingCount: number;
    averageRating: number | null;
    reviewCount: number;
  };
};

type TitlesListProps = {
  initialTitles: Title[];
  initialHasMore: boolean;
  initialNextPage: number | null;
  query: string;
  type: TitleType | "ALL";
  sort:
    | "newest"
    | "popular"
    | "highest-rated"
    | "most-reviewed"
    | "recently-added";
};

export default function TitlesList({
  initialTitles,
  initialHasMore,
  initialNextPage,
  query,
  type,
  sort,
}: TitlesListProps) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [selectedType, setSelectedType] = useState<TitleType | "ALL">(type);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [titleToRemove, setTitleToRemove] = useState<string | null>(null);
  const [titles, setTitles] = useState(initialTitles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setTitles(initialTitles);
    setHasMore(initialHasMore);
    setNextPage(initialNextPage);
  }, [initialTitles, initialHasMore, initialNextPage]);

  const applyFilters = useCallback(
    (nextQuery = search, nextType = selectedType, nextSort = sort) => {
      const params = new URLSearchParams();

      if (nextQuery.trim()) {
        params.set("q", nextQuery.trim());
      }

      if (nextType !== "ALL") {
        params.set("type", nextType);
      }

      if (nextSort !== "newest") {
        params.set("sort", nextSort);
      }

      router.push(`/titles${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [router, search, selectedType, sort],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      applyFilters(search, selectedType);
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [search, selectedType, applyFilters]);

  const toggleLibrary = (titleId: string, isInLibrary: boolean) => {
    setPendingId(titleId);

    startTransition(async () => {
      const result = await toggleLibraryTitle(titleId);

      setPendingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(isInLibrary ? "Removed from library" : "Added to library");
      setTitleToRemove(null);
      router.refresh();
    });
  };

  const loadMoreTitles = async () => {
    if (!nextPage || isLoadingMore) {
      return;
    }

    const pageToLoad = nextPage;

    setNextPage(null);
    setIsLoadingMore(true);

    try {
      const result = await getTitles({
        query: search,
        type: selectedType,
        sort,
        page: pageToLoad,
        limit: 24,
      });

      setTitles((currentTitles) => {
        const existingIds = new Set(currentTitles.map((title) => title.id));

        return [
          ...currentTitles,
          ...result.titles.filter((title) => !existingIds.has(title.id)),
        ];
      });

      setHasMore(result.hasMore);
      setNextPage(result.nextPage);
    } finally {
      setIsLoadingMore(false);
    }
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

          <div className="flex flex-nowrap justify-center gap-2 overflow-x-auto pb-1">
            {TITLE_SORT_OPTIONS.map((option) => {
              const active = sort === option.value;

              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    applyFilters(search, selectedType, option.value)
                  }
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
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {titles.map((title) => {
            const isInLibrary = Boolean(title.currentUserTitle);
            const isItemPending = isPending && pendingId === title.id;
            const averageRating = title.stats.averageRating?.toFixed(1) ?? "-";

            return (
              <GlassCard key={title.id} className="overflow-hidden p-0">
                <Link
                  href={`/titles/${title.slug}`}
                  className="relative block aspect-4/3 border-b border-white/10 bg-black/30"
                >
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
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/titles/${title.slug}`}
                        className="block min-w-0"
                      >
                        <h2 className="truncate text-lg font-semibold text-white hover:text-white/80">
                          {title.name}
                        </h2>
                      </Link>
                      <p className="mt-1 text-sm text-white/50">
                        {title.type}
                        {title.year ? ` . ${title.year}` : ""}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (isInLibrary) {
                          setTitleToRemove(title.id);
                          return;
                        }

                        toggleLibrary(title.id, false);
                      }}
                      disabled={isPending}
                      className={
                        isInLibrary
                          ? "h-9 bg-primary/15 text-primary hover:bg-primary/25"
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

                  <div className="grid h-10 grid-cols-3 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 text-xs text-white/60">
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-white/40" />
                      <span>{title.stats.libraryCount}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Star className="size-3.5 text-primary/80" />
                      <span>
                        {title.stats.ratingCount > 0
                          ? `${averageRating} (${title.stats.ratingCount})`
                          : "-"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 text-white/40" />
                      <span>{title.stats.reviewCount}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
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
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            disabled={isLoadingMore || !nextPage}
            onClick={loadMoreTitles}
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(titleToRemove)}
        onOpenChange={(open) => {
          if (!open) setTitleToRemove(null);
        }}
        title="Remove from library?"
        description="Your rating and comment for this title will be deleted."
        confirmText="Remove"
        cancelText="Cancel"
        isPending={isPending}
        onConfirm={() => {
          if (!titleToRemove) return;
          toggleLibrary(titleToRemove, true);
        }}
      />
    </div>
  );
}
