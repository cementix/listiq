"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { logoutUser } from "@/actions/auth";
import { DropdownMenu } from "radix-ui";
import { startTransition } from "react";

export default function UserMenu({
  username,
  avatarUrl,
  isPro = false,
}: {
  username: string;
  avatarUrl: string | null;
  isPro?: boolean;
}) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/75 transition hover:border-white/20 hover:bg-white/10 hover:text-white data-[state=open]:border-violet-400/40 data-[state=open]:bg-white/10"
        >
          <span className="sr-only">Account menu,</span>
          <span className="sr-only xl:not-sr-only xl:block xl:max-w-36 xl:truncate">@{username}</span>

          <span aria-hidden className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-white/10">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-xs font-semibold text-white/60">
                {username.slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>

          {isPro && (
            <span className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">PRO</span>
          )}
          <ChevronDown className="size-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-48 rounded-2xl border border-white/10 bg-zinc-950/90 p-1.5 text-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2"
        >
          <DropdownMenu.Item asChild>
            <Link
              href={`/users/${username}`}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-white/75 outline-none hover:bg-white/10 hover:text-white focus:bg-white/10"
            >
              <UserRound className="size-4" />
              My profile
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href="/settings/profile"
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-white/75 outline-none hover:bg-white/10 hover:text-white focus:bg-white/10"
            >
              <Settings className="size-4" />
              Profile settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
          <DropdownMenu.Item
            onSelect={() => {
              // The menu unmounts on select, so a nested <form> would never submit.
              startTransition(() => logoutUser());
            }}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-rose-200/80 outline-none hover:bg-rose-500/10 hover:text-rose-100 focus:bg-rose-500/10"
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
