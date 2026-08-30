import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  MinusCircle,
  PlusCircle,
  Send,
  Star,
} from "lucide-react";

import { getActivityCopy, getActivityIconClass } from "./ProfileUtils";

type ActivityEvent = {
  id: string;
  type: string;
  rating: number | null;
  createdAt: Date;
};

type ActivityGroup = {
  key: string;
  title: string;
  href: string;
  createdAt: Date;
  events: ActivityEvent[];
};

type ProfileActivityGroupProps = {
  group: ActivityGroup;
  compact?: boolean;
};

const getActivityIcon = (type: string) => {
  if (type === "TITLE_ADDED") return PlusCircle;
  if (type === "TITLE_REMOVED") return MinusCircle;
  if (type === "TITLE_RATED") return Star;
  if (type === "TITLE_REVIEWED") return MessageSquare;
  if (type === "TITLE_SUBMITTED") return Send;

  return CheckCircle2;
};

export default function ProfileActivityGroup({
  group,
  compact = false,
}: ProfileActivityGroupProps) {
  const firstEvent = group.events[0];

  if (!firstEvent) {
    return null;
  }

  const ActivityIcon = getActivityIcon(firstEvent.type);
  const actionCount = group.events.length;
  const actionLabel =
    actionCount === 1 ? getActivityCopy(firstEvent) : `${actionCount} actions`;

  if (actionCount === 1) {
    return (
      <Link
        href={group.href}
        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/10"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <ActivityIcon
              className={`size-4 ${getActivityIconClass(firstEvent.type)}`}
            />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-white">{group.title}</p>
            <p className="mt-1 text-sm text-white/45">{actionLabel}</p>
          </div>
        </div>

        <p className="shrink-0 text-right text-sm text-white/45">
          {group.createdAt.toLocaleDateString("en-US")}
        </p>
      </Link>
    );
  }

  return (
    <details className="group rounded-xl border border-white/10 bg-black/20 transition hover:bg-white/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex shrink-0 items-center justify-center border border-white/10 bg-white/5 ${
              compact ? "size-8 rounded-lg" : "size-10 rounded-xl"
            }`}
          >
            <ActivityIcon
              className={`size-4 ${getActivityIconClass(firstEvent.type)}`}
            />
          </div>

          <div className="min-w-0">
            <p
              className={`truncate font-medium text-white ${
                compact ? "text-sm" : ""
              }`}
            >
              {group.title}
            </p>
            <p
              className={`mt-1 text-white/45 ${compact ? "text-xs" : "text-sm"}`}
            >
              {actionLabel}
            </p>
          </div>
        </div>

        <div
          className={`flex shrink-0 items-center gap-2 text-white/45 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          <span>{group.createdAt.toLocaleDateString("en-US")}</span>
          <ChevronDown className="size-4 transition group-open:rotate-180" />
        </div>
      </summary>

      <div className="border-t border-white/10 px-3 pb-3 pt-1">
        <div className="space-y-2">
          {group.events.map((event) => {
            const EventIcon = getActivityIcon(event.type);

            return (
              <Link
                key={event.id}
                href={group.href}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-white/5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <EventIcon
                    className={`size-4 shrink-0 ${getActivityIconClass(
                      event.type,
                    )}`}
                  />
                  <p
                    className={`truncate text-white/65 ${
                      compact ? "text-xs" : "text-sm"
                    }`}
                  >
                    {getActivityCopy(event)}
                  </p>
                </div>

                <p className="shrink-0 text-xs text-white/35">
                  {event.createdAt.toLocaleDateString("en-US")}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </details>
  );
}
