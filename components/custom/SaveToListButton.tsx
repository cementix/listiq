"use client";

import { useState } from "react";
import { useMutation } from "@/lib/hooks/use-mutation";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Globe2,
  List,
  LoaderCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { addTitleToList } from "@/actions/title-list/addTitleToList";
import { getTitleListOptions } from "@/actions/title-list/getTitleListOptions";
import { removeTitleFromList } from "@/actions/title-list/removeTitleFromList";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

type ListOption = {
  id: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  systemType: "SAVE_FOR_LATER" | null;
  containsTitle: boolean;
};

type SaveToListButtonProps = {
  titleId: string;
  compact?: boolean;
};

export default function SaveToListButton({
  titleId,
  compact = false,
}: SaveToListButtonProps) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingListId, setPendingListId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [, runMutation] = useMutation();
  const [, runLoad] = useMutation();

  const hasSavedList = lists?.some((list) => list.containsTitle) ?? false;

  const loadLists = () => runLoad(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getTitleListOptions({ titleId });
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setLists(result.lists);
    } catch {
      setLoadError("Couldn't load your lists.");
    } finally {
      setIsLoading(false);
    }
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      void loadLists();
    }
  };

  const handleToggleList = (list: ListOption) => runMutation(async () => {
    setPendingListId(list.id);
    try {
    const result = list.containsTitle
      ? await removeTitleFromList({
          listId: list.id,
          titleId,
        })
      : await addTitleToList({
          listId: list.id,
          titleId,
        });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setLists(
      (currentLists) =>
        currentLists?.map((currentList) =>
          currentList.id === list.id
            ? {
                ...currentList,
                containsTitle: !currentList.containsTitle,
              }
            : currentList,
        ) ?? null,
    );

    toast.success(
      list.containsTitle
        ? `Removed from ${list.title}`
        : `Added to ${list.title}`,
    );
    } finally {
      setPendingListId(null);
    }
  });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size={compact ? "icon" : "default"}
          aria-label="Save to list"
          title="Save to list"
          onClick={(event) => event.stopPropagation()}
        >
          {hasSavedList ? <BookmarkCheck /> : <Bookmark />}
          {!compact && "Save to list"}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 max-w-[calc(100vw-2rem)] max-h-[min(420px,70dvh)] overflow-y-auto overscroll-contain border border-white/10 bg-black text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <PopoverHeader className="border-b border-white/10 pb-2">
          <PopoverTitle>Save to list</PopoverTitle>
        </PopoverHeader>

        {isLoading ? (
          <div role="status" aria-label="Loading lists" className="flex min-h-24 items-center justify-center">
            <LoaderCircle className="size-5 animate-spin text-white/50" />
          </div>
        ) : loadError ? (
          <div role="alert" className="space-y-3 py-4 text-center">
            <p className="text-sm text-white/60">{loadError}</p>
            <Button type="button" variant="outline" onClick={loadLists}>Try again</Button>
          </div>
        ) : lists && lists.length > 0 ? (
          <div className="space-y-1">
            {lists.map((list) => {
              const isPending = pendingListId === list.id;

              return (
                <button
                  key={list.id}
                  type="button"
                  disabled={pendingListId !== null}
                  onClick={() => void handleToggleList(list)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/10 disabled:opacity-50"
                >
                  {list.systemType ? (
                    <Bookmark className="size-4 shrink-0 text-primary" />
                  ) : (
                    <List className="size-4 shrink-0 text-white/50" />
                  )}

                  <span className="min-w-0 flex-1 truncate text-sm">
                    {list.title}
                  </span>

                  {list.visibility === "PUBLIC" ? (
                    <Globe2 className="size-3.5 text-white/35" />
                  ) : (
                    <Lock className="size-3.5 text-white/35" />
                  )}

                  {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : list.containsTitle ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <span className="size-4" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-6 text-center text-sm text-white/45">
            No lists available
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
