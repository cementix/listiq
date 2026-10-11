"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, Plus, Save, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { toggleLibraryTitle } from "@/actions/title/toggleLibraryTitle";
import { updateUserTitle } from "@/actions/title/updateUserTitle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ConfirmDialog from "@/components/custom/ConfirmDialog";

type UserTitle = {
  id: string;
  rating: number | null;
  note: string | null;
};

type Props = {
  titleId: string;
  currentUserTitle: UserTitle | null;
};

const TitleLibraryPanel = ({ titleId, currentUserTitle }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rating, setRating] = useState(
    currentUserTitle?.rating?.toString() ?? "",
  );
  const [note, setNote] = useState(currentUserTitle?.note ?? "");

  const [confirmOpen, setConfirmOpen] = useState(false);

  const isInLibrary = Boolean(currentUserTitle);

  const toggleLibrary = () => {
    startTransition(async () => {
      const result = await toggleLibraryTitle(titleId);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(isInLibrary ? "Removed from library" : "Added to library");
      setConfirmOpen(false);
      router.refresh();
    });
  };

  const save = () => {
    const parsedRating = rating.trim() ? Number(rating) : null;

    const isValidHalfStep =
      parsedRating === null ||
      (parsedRating >= 1 &&
        parsedRating <= 10 &&
        parsedRating * 2 === Math.round(parsedRating * 2));

    if (!isValidHalfStep) {
      toast.error("Rating must be from 1 to 10 in 0.5 steps");
      return;
    }

    startTransition(async () => {
      const result = await updateUserTitle({
        titleId,
        rating: parsedRating,
        note: note.trim() || null,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Saved");
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Your entry</h2>
          <p className="text-sm text-white/50">
            {isInLibrary ? "Saved in your library" : "Not in your library yet"}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            if (isInLibrary) {
              setConfirmOpen(true);
              return;
            }

            toggleLibrary();
          }}
          disabled={isPending}
          className={
            isInLibrary
              ? "bg-red-500/10 text-red-200 hover:bg-red-500/20"
              : "bg-white text-black hover:bg-white/90"
          }
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : isInLibrary ? (
            <Trash2 className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {isInLibrary ? "Remove" : "Add"}
        </Button>
      </div>

      {isInLibrary && (
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm text-white/70">Rating</label>

            <select aria-label="Rating" value={rating} onChange={(event) => setRating(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 text-base sm:hidden">
              <option value="">No rating</option>
              {Array.from({ length: 19 }, (_, index) => 1 + index * 0.5).map((value) => <option key={value} value={value}>{value}/10</option>)}
            </select>
            <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
              {Array.from({ length: 10 }, (_, index) => {
                const value = index + 1;
                const ratingNumber = Number(rating);
                const fillPercent =
                  ratingNumber >= value
                    ? 100
                    : ratingNumber >= value - 0.5
                      ? 50
                      : 0;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Rate ${value} out of 10`}
                    onClick={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      const isLeftHalf = event.detail !== 0 &&
                        event.clientX - rect.left < rect.width / 2;
                      setRating(
                        String(isLeftHalf ? Math.max(1, value - 0.5) : value),
                      );
                    }}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-1 text-primary transition hover:bg-primary/10"
                  >
                    <span className="relative block size-6">
                      <Star className="absolute inset-0 size-6 text-white/25" />

                      <span
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${fillPercent}%` }}
                      >
                        <Star className="size-6 fill-primary text-primary drop-shadow-[0_0_10px_rgba(167,139,250,0.35)]" />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {rating && (
              <button
                type="button"
                onClick={() => setRating("")}
                className="mt-2 min-h-11 text-xs text-white/45 hover:text-white/70"
              >
                Clear rating
              </button>
            )}
          </div>

          <div>
            <label className="text-sm text-white/70">Comment</label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write your thoughts"
              className="mt-2 min-h-28 border-white/10 bg-white/5 text-white placeholder:text-white/35"
            />
          </div>

          <Button type="button" onClick={save} disabled={isPending}>
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove from library?"
        description="Your rating and comment for this title will be deleted."
        confirmText="Remove"
        cancelText="Cancel"
        isPending={isPending}
        onConfirm={toggleLibrary}
      />
    </div>
  );
};

export default TitleLibraryPanel;
