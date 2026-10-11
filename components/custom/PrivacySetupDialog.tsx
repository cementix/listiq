"use client";

import { useMutation } from "@/lib/hooks/use-mutation";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { updatePrivacySettings } from "@/actions/profile/updatePrivacySettings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const options = [
  { key: "libraryPublic", label: "Library" },
  { key: "reviewsPublic", label: "Ratings and reviews" },
  { key: "statsPublic", label: "Profile statistics" },
  { key: "postsPublic", label: "Posts" },
  { key: "titleActivityPublic", label: "Title activity" },
  { key: "listActivityPublic", label: "List activity" },
] as const;

type PrivacyKey = (typeof options)[number]["key"];
type PrivacySettings = Record<PrivacyKey, boolean>;

const initialSettings: PrivacySettings = {
  libraryPublic: false,
  reviewsPublic: false,
  statsPublic: false,
  postsPublic: false,
  titleActivityPublic: false,
  listActivityPublic: false,
};

export default function PrivacySetupDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, runMutation] = useMutation();

  const save = () => {
    runMutation(async () => {
      try {
        const result = await updatePrivacySettings(settings);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to save privacy settings");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] z-9999 overflow-y-auto border-white/10 bg-black text-white sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Choose your privacy settings</DialogTitle>
          <DialogDescription>
            Choose what other people can see. You can change this later.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-white/10">
          {options.map(({ key, label }) => (
            <div
              key={key}
              className="flex min-h-14 items-center justify-between gap-4"
            >
              <label htmlFor={key} className="cursor-pointer text-sm">
                {label}
              </label>
              <Switch
                id={key}
                checked={settings[key]}
                disabled={isPending}
                onCheckedChange={(checked) =>
                  setSettings((current) => ({ ...current, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <Button type="button" disabled={isPending} onClick={save}>
          {isPending && <LoaderCircle className="size-4 animate-spin" />}
          Save preferences
        </Button>
      </DialogContent>
    </Dialog>
  );
}
