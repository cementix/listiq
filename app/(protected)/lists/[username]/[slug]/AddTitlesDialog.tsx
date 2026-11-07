"use client";

import { useMutation } from "@/lib/hooks/use-mutation";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LoaderCircle, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { getTitles } from "@/actions/title/getTitles";
import { addTitleToList } from "@/actions/title-list/addTitleToList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SearchTitle = Awaited<ReturnType<typeof getTitles>>["titles"][number];

type Props = {
  listId: string;
  existingTitleIds: string[];
};

export default function AddTitlesDialog({ listId, existingTitleIds }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [titles, setTitles] = useState<SearchTitle[]>([]);
  const [addedIds, setAddedIds] = useState(() => new Set(existingTitleIds));
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setSearchError(false);

      try {
        const result = await getTitles({
          query: query.trim(),
          page: 1,
          limit: 12,
          searchMode: "fuzzy",
        });

        if (!cancelled) setTitles(result.titles);
      } catch {
        if (!cancelled) setSearchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query, searchAttempt]);

  const [, runMutation] = useMutation();

  const addTitle = (titleId: string) => runMutation(async () => {
    setPendingId(titleId);

    try {
      const result = await addTitleToList({ listId, titleId });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setAddedIds((current) => new Set(current).add(titleId));
      toast.success(result.message ?? "Title added");
    } catch {
      toast.error("Failed to add title");
    } finally {
      setPendingId(null);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen} stableScroll>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus />
          Add titles
        </Button>
      </DialogTrigger>

      <DialogContent className="border-white/10 bg-black text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add titles</DialogTitle>
          <DialogDescription>
            Search the catalog and add titles to this list.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles"
            aria-label="Search titles"
            className="pl-10"
          />
        </div>

        <div className="list-dialog-scroll max-h-96 space-y-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div role="status" aria-label="Searching titles" className="flex h-32 items-center justify-center">
              <LoaderCircle className="size-5 animate-spin text-white/50" />
            </div>
          ) : searchError ? (
            <div role="alert" className="space-y-3 py-8 text-center">
              <p className="text-sm text-white/60">Couldn&apos;t search titles.</p>
              <Button type="button" variant="outline" onClick={() => setSearchAttempt((value) => value + 1)}>Try again</Button>
            </div>
          ) : titles.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/50">
              No titles found
            </p>
          ) : (
            titles.map((title) => {
              const added = addedIds.has(title.id);
              const pending = pendingId === title.id;

              return (
                <div
                  key={title.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
                >
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-white/5">
                    {title.imageUrl && (
                      <Image
                        src={title.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{title.name}</p>
                    <p className="text-xs text-white/45">
                      {title.type}
                      {title.year ? ` · ${title.year}` : ""}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={added || pendingId !== null}
                    onClick={() => void addTitle(title.id)}
                  >
                    {pending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : added ? (
                      "Added"
                    ) : (
                      <Plus />
                    )}
                    {!pending && !added && (
                      <span className="sr-only">Add {title.name}</span>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
