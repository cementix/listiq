"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Globe2, LoaderCircle, Lock, Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateTitleList } from "@/actions/title-list/updateTitleList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Visibility = "PRIVATE" | "PUBLIC";

type Props = {
  listId: string;
  title: string;
  description: string | null;
  visibility: Visibility;
};

export default function EditTitleListDialog({
  listId,
  title: initialTitle,
  description: initialDescription,
  visibility: initialVisibility,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [visibility, setVisibility] = useState(initialVisibility);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setTitle(initialTitle);
    setDescription(initialDescription ?? "");
    setVisibility(initialVisibility);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;

    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        const result = await updateTitleList({
          listId,
          title,
          description,
          visibility,
        });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success(result.message ?? "List updated");
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error("Failed to update the list");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} stableScroll>
      <DialogTrigger asChild>
        <Button type="button">
          <Pencil />
          Edit list
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-6 border-white/10 bg-black text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit list</DialogTitle>
          <DialogDescription>
            Change its details and visibility.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <Label htmlFor="edit-list-title" className="block">
              Title
            </Label>
            <Input
              id="edit-list-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-list-description" className="block">
              Description
            </Label>
            <Textarea
              id="edit-list-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              disabled={isPending}
              className="min-h-28"
            />
          </div>

          <fieldset className="space-y-3" disabled={isPending}>
            <legend className="text-sm font-medium">Visibility</legend>

            <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                aria-pressed={visibility === "PUBLIC"}
                onClick={() => setVisibility("PUBLIC")}
                className={`flex h-10 items-center cursor-pointer justify-center gap-2 rounded-md text-sm transition ${
                  visibility === "PUBLIC"
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Globe2 className="size-4" />
                Public
              </button>

              <button
                type="button"
                aria-pressed={visibility === "PRIVATE"}
                onClick={() => setVisibility("PRIVATE")}
                className={`flex h-10 items-center cursor-pointer justify-center gap-2 rounded-md text-sm transition ${
                  visibility === "PRIVATE"
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Lock className="size-4" />
                Private
              </button>
            </div>
          </fieldset>

          <DialogFooter className="border-white/10 bg-transparent">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Pencil className="size-4" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
