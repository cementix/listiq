import Link from "next/link";
import { ListPlus, Plus } from "lucide-react";

import GlassCard from "@/components/custom/GlassCard";
import { formatRelativeDate } from "./ProfileUtils";

type ListActivityItem = {
  id: string;
  kind: "created" | "title-added";
  createdAt: Date;
  listTitle: string;
  listHref: string;
  titleName: string | null;
  titleHref: string | null;
};

export default function ProfileListActivity({
  items,
}: {
  items: ListActivityItem[];
}) {
  return (
    <GlassCard className="p-5">
      <h2 className="text-xl font-semibold text-white">Recent list activity</h2>

      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-white/50">No list activity yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 text-sm">
              {item.kind === "created" ? (
                <ListPlus className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <Plus className="mt-0.5 size-4 shrink-0 text-white/45" />
              )}

              <div className="min-w-0">
                <p className="leading-5 text-white/60">
                  {item.kind === "created" ? (
                    <>Created </>
                  ) : (
                    <>
                      Added{" "}
                      <Link
                        href={item.titleHref!}
                        className="text-white hover:text-primary"
                      >
                        {item.titleName}
                      </Link>{" "}
                      to{" "}
                    </>
                  )}
                  <Link
                    href={item.listHref}
                    className="font-medium text-white hover:text-primary"
                  >
                    {item.listTitle}
                  </Link>
                </p>
                <time
                  dateTime={item.createdAt.toISOString()}
                  className="mt-1 block text-xs text-white/40"
                >
                  {formatRelativeDate(item.createdAt)}
                </time>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
