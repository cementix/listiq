"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Settings, UserRound } from "lucide-react";
import { DropdownMenu } from "radix-ui";

export default function UserMenu({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl: string | null;
}) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <span>@{username}</span>

          <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-white/10">
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

          <ChevronDown className="size-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-32 rounded-lg border border-white/10 bg-black p-1 text-white shadow-2xl"
        >
          <DropdownMenu.Item asChild>
            <Link
              href={`/users/${username}`}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-white/75 outline-none hover:bg-white/10 hover:text-white focus:bg-white/10"
            >
              <UserRound className="size-4" />
              My profile
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href="/settings/profile"
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-white/75 outline-none hover:bg-white/10 hover:text-white focus:bg-white/10"
            >
              <Settings className="size-4" />
              Profile settings
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
