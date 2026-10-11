"use client";

import { useMutation } from "@/lib/hooks/use-mutation";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Bookmark, BookmarkCheck, List } from "lucide-react";
import { toast } from "sonner";

import { setTitleListSaved } from "@/actions/title-list/setTitleListSaved";
import { Button } from "@/components/ui/button";
import type { getPublicTitleLists } from "@/lib/title-list/getPublicTitleLists";

type PublicList = Awaited<
  ReturnType<typeof getPublicTitleLists>
>["lists"][number];

export default function PublicListCard({ list }: { list: PublicList }) {
  const router = useRouter();
  const [saved, setSaved] = useState(list.isSaved);
  const [pending, setPending] = useState(false);
  const preview = Array.from(
    { length: 4 },
    (_, index) => list.items[index] ?? null,
  );

  const [, runMutation] = useMutation();

  const toggleSaved = () => runMutation(async () => {
    const next = !saved;
    setPending(true);

    try {
      const result = await setTitleListSaved({ listId: list.id, saved: next });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setSaved(next);
      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Failed to update saved list");
    } finally {
      setPending(false);
    }
  });

  return (
    <article className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.07]">
      <Link
        href={`/lists/${list.user.username}/${list.slug}`}
        className="block"
      >
        <div className="grid aspect-[2/1] grid-cols-4 gap-px overflow-hidden border-b border-white/10 bg-white/10">
          {preview.map((item, index) => (
            <div
              key={item?.title.id ?? `empty-${index}`}
              className="relative bg-black/40"
            >
              {item?.title.imageUrl ? (
                <Image
                  src={item.title.imageUrl}
                  alt={item.title.name}
                  fill
                  sizes="160px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <List className="size-5 text-white/15" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-medium text-white">
                {list.title}
              </h2>
              <p className="mt-1 text-xs text-white/45">
                @{list.user.username} · {list._count.items}{" "}
                {list._count.items === 1 ? "title" : "titles"}
              </p>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-white/35 group-hover:text-white" />
          </div>

          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-white/50">
            {list.description || "No description"}
          </p>

          <div className="mt-3 flex justify-between gap-2 text-xs text-white/55">
            <span>
              {list.viewer.completionPercentage}% completed (
              {list.viewer.completedCount}/{list.viewer.totalCount})
            </span>
            <span>
              {list.viewer.averageRating === null
                ? "No ratings"
                : `Your avg ${list.viewer.averageRating.toFixed(1)}/10`}
            </span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-label={`Your completion of ${list.title}`}
          aria-valuenow={list.viewer.completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full bg-white/10"
        >
          <div
            className="h-full bg-emerald-400"
            style={{ width: `${list.viewer.completionPercentage}%` }}
          />
        </div>
      </Link>

      {!list.isOwner && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          onClick={() => void toggleSaved()}
          aria-label={
            saved
              ? `Remove ${list.title} from saved lists`
              : `Save ${list.title}`
          }
          title={saved ? "Remove from saved" : "Save list"}
          className="absolute right-2 top-2 z-10 bg-black/75 text-white hover:bg-black/90 hover:text-white"
        >
          {saved ? (
            <BookmarkCheck className="size-4" />
          ) : (
            <Bookmark className="size-4" />
          )}
        </Button>
      )}
    </article>
  );
}
