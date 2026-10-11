"use client";

import { useMutation } from "@/lib/hooks/use-mutation";

import { useState } from "react";
import { Bookmark, BookmarkCheck, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { setTitleListSaved } from "@/actions/title-list/setTitleListSaved";
import { Button } from "@/components/ui/button";

type Props = {
  listId: string;
  initialSaved: boolean;
};

export default function SaveTitleListButton({ listId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  const [, runMutation] = useMutation();

  const toggleSaved = () => runMutation(async () => {
    setPending(true);

    try {
      const nextSaved = !saved;
      const result = await setTitleListSaved({
        listId,
        saved: nextSaved,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setSaved(nextSaved);
      toast.success(result.message ?? "Saved lists updated");
    } catch {
      toast.error("Failed to update saved list");
    } finally {
      setPending(false);
    }
  });

  return (
    <Button type="button" disabled={pending} onClick={() => void toggleSaved()}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="size-4" />
      ) : (
        <Bookmark className="size-4" />
      )}
      {saved ? "Saved" : "Save list"}
    </Button>
  );
}
