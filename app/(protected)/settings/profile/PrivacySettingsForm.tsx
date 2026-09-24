"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { updatePrivacySettings } from "@/actions/profile/updatePrivacySettings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Settings = {
  libraryPublic: boolean;
  reviewsPublic: boolean;
  statsPublic: boolean;
  postsPublic: boolean;
  titleActivityPublic: boolean;
  listActivityPublic: boolean;
};

const options: { key: keyof Settings; label: string }[] = [
  { key: "libraryPublic", label: "Library" },
  { key: "reviewsPublic", label: "Ratings and reviews" },
  { key: "statsPublic", label: "Profile statistics" },
  { key: "postsPublic", label: "Posts" },
  { key: "titleActivityPublic", label: "Title activity" },
  { key: "listActivityPublic", label: "List activity" },
];

export default function PrivacySettingsForm({
  initialSettings,
}: {
  initialSettings: Settings;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      try {
        const result = await updatePrivacySettings(settings);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success("Privacy settings saved");
        router.refresh();
      } catch {
        toast.error("Failed to save privacy settings");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="divide-y divide-white/10">
        {options.map(({ key, label }) => (
          <div
            key={key}
            className="flex min-h-14 items-center justify-between gap-4"
          >
            <label
              htmlFor={`setting-${key}`}
              className="cursor-pointer text-sm"
            >
              {label}
            </label>
            <Switch
              id={`setting-${key}`}
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
        Save privacy settings
      </Button>
    </div>
  );
}
