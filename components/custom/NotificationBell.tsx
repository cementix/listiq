"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Heart, Loader2, MessageCircle, Reply } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useState, useTransition } from "react";

import { getNotifications, markNotificationsRead, type NotificationItem } from "@/actions/notifications";
import { cn } from "@/lib/utils";

const COPY: Record<NotificationItem["type"], { verb: string; icon: typeof Bell }> = {
  PROFILE_POST_COMMENT: { verb: "commented on your post", icon: MessageCircle },
  PROFILE_POST_REPLY: { verb: "replied to your comment", icon: Reply },
  PROFILE_POST_COMMENT_LIKE: { verb: "liked your comment", icon: Heart },
};

function timeAgo(iso: string) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const units: [number, string][] = [[31_536_000, "y"], [2_592_000, "mo"], [86_400, "d"], [3_600, "h"], [60, "m"]];
  for (const [size, label] of units) if (seconds >= size) return `${Math.floor(seconds / size)}${label}`;
  return "now";
}

export default function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [pending, startTransition] = useTransition();

  const onOpenChange = (open: boolean) => {
    if (!open) return;
    startTransition(async () => {
      setItems(await getNotifications());
      if (unread > 0) {
        await markNotificationsRead();
        setUnread(0);
      }
    });
  };

  return (
    <DropdownMenu.Root modal={false} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="relative grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-white/20 hover:text-white data-[state=open]:border-violet-400/40 data-[state=open]:text-white"
        >
          <Bell aria-hidden className="size-[18px]" />
          <span className="sr-only">Notifications{unread ? `, ${unread} unread` : ""}</span>
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                aria-hidden
                className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1 text-[10px] font-bold text-white ring-2 ring-black"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          collisionPadding={12}
          className="z-50 w-[min(92vw,360px)] origin-[var(--radix-dropdown-menu-content-transform-origin)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 text-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {pending && <Loader2 className="size-4 animate-spin text-violet-300" />}
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-1.5">
            {items === null ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((row) => <div key={row} className="h-12 animate-pulse rounded-xl bg-white/5" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="grid size-10 place-items-center rounded-xl bg-white/5 text-white/50"><Bell className="size-4" /></span>
                <p className="text-sm font-medium">You&apos;re all caught up</p>
                <p className="text-xs text-white/50">Comments, replies and likes on your posts show up here.</p>
              </div>
            ) : (
              items.map((item) => {
                const { verb, icon: Icon } = COPY[item.type];
                return (
                  <DropdownMenu.Item key={item.id} asChild>
                    <Link href={item.href} className={cn("flex gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors hover:bg-white/[0.06] focus:bg-white/[0.06]", item.unread && "bg-violet-500/[0.07]")}>
                      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-fuchsia-400/40 to-violet-500/40 text-xs font-semibold">
                        {item.actor.avatarUrl ? <Image src={item.actor.avatarUrl} alt="" fill sizes="36px" className="object-cover" unoptimized /> : item.actor.username.slice(0, 1).toUpperCase()}
                        <span className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-zinc-900 ring-1 ring-white/10"><Icon className="size-2.5 text-violet-300" /></span>
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="text-white/80"><b className="font-semibold text-white">@{item.actor.username}</b> {verb}</span>
                        {item.snippet && <span className="mt-0.5 block truncate text-xs text-white/50">“{item.snippet}”</span>}
                      </span>
                      <span className="shrink-0 text-[11px] text-white/45">{timeAgo(item.createdAt)}</span>
                    </Link>
                  </DropdownMenu.Item>
                );
              })
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
