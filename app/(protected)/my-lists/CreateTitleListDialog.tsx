"use client";

import { useState, useTransition } from "react";
import { Globe2, LoaderCircle, Lock, Plus } from "lucide-react";
import { toast } from "sonner";

import { createTitleList } from "@/actions/title-list/createTitleList";
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

type Visibility = "PUBLIC" | "PRIVATE";

export default function CreateTitleListDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVisibility("PUBLIC");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;

    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await createTitleList({
        title,
        description,
        visibility,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "List created");
      resetForm();
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} stableScroll>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus />
          New list
        </Button>
      </DialogTrigger>

      <DialogContent className="border-white/10 bg-black text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create list</DialogTitle>
          <DialogDescription>
            Build a custom collection of titles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <Label htmlFor="list-title" className="block">
              Title
            </Label>
            <Input
              id="list-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="100 best Korean movies"
              maxLength={80}
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="list-description" className="block">
              Description
            </Label>
            <Textarea
              id="list-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
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
              {isPending ? <LoaderCircle className="animate-spin" /> : <Plus />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
