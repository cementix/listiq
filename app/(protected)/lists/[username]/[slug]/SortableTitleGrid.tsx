"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { Check, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { reorderTitleListItems } from "@/actions/title-list/reorderTitleListItems";
import { Button } from "@/components/ui/button";
import SortableTitleCard, { type SortableListItem } from "./SortableTitleCard";

type Props = {
  listId: string;
  initialItems: SortableListItem[];
  isOwner: boolean;
};

export default function SortableTitleGrid({
  listId,
  initialItems,
  isOwner,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [savedItems, setSavedItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);

  const changed =
    items.length !== savedItems.length ||
    items.some((item, index) => item.id !== savedItems[index]?.id);

  const save = async () => {
    setSaving(true);

    try {
      const result = await reorderTitleListItems({
        listId,
        itemIds: items.map((item) => item.id),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setSavedItems(items);
      toast.success("List order saved");
      router.refresh();
    } catch {
      toast.error("Failed to save list order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled || !isOwner || saving) return;

          const { source } = event.operation;
          if (!isSortable(source)) return;

          const { initialIndex, index } = source;
          if (initialIndex === index) return;

          setItems((current) => {
            const next = [...current];
            const [moved] = next.splice(initialIndex, 1);
            if (!moved) return current;

            next.splice(index, 0, moved);
            return next;
          });
        }}
      >
        <ol
          className={`grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${
            changed ? "pb-24" : ""
          }`}
        >
          {items.map((item, index) => (
            <SortableTitleCard
              key={item.id}
              item={item}
              index={index}
              canReorder={isOwner && !saving}
            />
          ))}
        </ol>
      </DragDropProvider>

      {isOwner && changed && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-lg border border-white/15 bg-black/95 px-3 py-2 shadow-xl">
          <span className="text-sm text-white/65">Unsaved order</span>

          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => setItems(savedItems)}
          >
            <X />
            Cancel
          </Button>

          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? <LoaderCircle className="animate-spin" /> : <Check />}
            Save
          </Button>
        </div>
      )}
    </>
  );
}
