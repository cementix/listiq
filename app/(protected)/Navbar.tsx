"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { motion } from "motion/react";
import { BookOpen, ChevronDown, Compass, Home, List, Menu, Plus, Settings, ShieldCheck, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import LogoutButton from "./LogoutButton";
import UserMenu from "./UserMenu";

type Props = { username: string; avatarUrl: string | null; needsChangesCount: number; canReview: boolean };

export default function Navbar({ username, avatarUrl, needsChangesCount, canReview }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const groups = [
    { label: "Titles", href: "/titles", items: [{ label: "Browse titles", href: "/titles" }, { label: "Add a title", href: "/add-title" }] },
    { label: "Submissions", href: "/my-submissions", items: [{ label: "My submissions", href: "/my-submissions" }, ...(canReview ? [{ label: "Review queue", href: "/submissions" }] : [])] },
    { label: "Lists", href: "/lists", items: [{ label: "Browse lists", href: "/lists" }, { label: "My lists", href: "/my-lists" }] },
  ];
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const mobileLinks = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Titles", href: "/titles", icon: BookOpen },
    { label: "Discover", href: "/discover", icon: Compass },
    { label: "My lists", href: "/my-lists", icon: List },
  ];
  const menuLinks = [
    ...mobileLinks,
    { label: "Browse lists", href: "/lists", icon: List },
    { label: "Add a title", href: "/add-title", icon: Plus },
    { label: "My submissions", href: "/my-submissions", icon: BookOpen },
    ...(canReview ? [{ label: "Review queue", href: "/submissions", icon: ShieldCheck }] : []),
    { label: "My profile", href: `/users/${username}`, icon: UserRound },
    { label: "Settings", href: "/settings/profile", icon: Settings },
  ];

  return (
    <>
      <header className="relative border-b border-white/[0.07] bg-black/65 backdrop-blur-xl backdrop-saturate-150">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-5 xl:gap-8">
            <Link href="/dashboard" className="group flex min-h-11 shrink-0 items-center gap-2 text-xl font-semibold tracking-tight text-white"><span aria-hidden className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-400 via-fuchsia-400 to-sky-400 text-[13px] font-bold text-black transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110">l</span>listiq</Link>
            <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
              {groups.map((group) => (
                <DropdownMenu.Root key={group.label} modal={false}>
                  <DropdownMenu.Trigger asChild>
                    <button type="button" className={cn("group/trigger relative isolate flex min-h-11 items-center gap-1 rounded-full px-3.5 text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-primary data-[state=open]:text-white", group.items.some((item) => active(item.href)) && "text-white")}>
                      {group.items.some((item) => active(item.href)) && <motion.span layoutId="nav-active" className="absolute inset-0 -z-10 rounded-full bg-white/[0.08] ring-1 ring-white/10" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                      {group.label}<ChevronDown className="size-3.5 transition-transform duration-300 group-data-[state=open]/trigger:rotate-180" />
                      {group.label === "Submissions" && needsChangesCount > 0 && <span className="rounded-full bg-amber-400/15 px-1.5 text-xs text-amber-200">{needsChangesCount}</span>}
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content sideOffset={10} collisionPadding={12} className="z-50 min-w-52 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-2xl border border-white/10 bg-zinc-950/90 p-1.5 text-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                      {group.items.map((item) => <DropdownMenu.Item key={item.href} asChild><Link href={item.href} aria-current={active(item.href) ? "page" : undefined} className="flex min-h-11 items-center rounded-xl px-3 text-sm text-white/75 outline-none transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 aria-[current=page]:text-white">{item.label}</Link></DropdownMenu.Item>)}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ))}
              <Link href="/discover" aria-current={active("/discover") ? "page" : undefined} className={cn("relative isolate flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm text-white/60 transition-colors hover:text-white", active("/discover") && "text-white")}>{active("/discover") && <motion.span layoutId="nav-active" className="absolute inset-0 -z-10 rounded-full bg-white/[0.08] ring-1 ring-white/10" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}<Compass className="size-4 text-violet-300" />Discover</Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <UserMenu username={username} avatarUrl={avatarUrl} />
            <button type="button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 lg:hidden"><Menu className="size-5" /></button>
          </div>
        </div>
      </header>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-black/75 px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        {mobileLinks.map(({ label, href, icon: Icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cn("relative isolate flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] text-white/50 transition active:scale-95", active(href) && "text-primary")}>{active(href) && <motion.span layoutId="mobile-nav-active" className="absolute inset-1 -z-10 rounded-xl bg-primary/12" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}<Icon className="size-5" /><span>{label}</span></Link>)}
        <button type="button" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] text-white/60 active:bg-white/10"><Menu className="size-5" /><span>Menu</span></button>
      </nav>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] border-white/10 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader className="pr-12"><DialogTitle>Navigation</DialogTitle><DialogDescription className="truncate">@{username}</DialogDescription></DialogHeader>
          <nav aria-label="All pages" className="grid gap-1">
            {menuLinks.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={active(href) ? "page" : undefined} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm text-white/70 hover:bg-white/5", active(href) && "bg-primary/10 text-primary")}><Icon className="size-5 shrink-0" /><span>{label}</span>{href === "/my-submissions" && needsChangesCount > 0 && <span className="ml-auto rounded-full bg-amber-400/15 px-2 text-xs text-amber-200">{needsChangesCount}</span>}</Link>)}
          </nav>
          <div className="border-t border-white/10 pt-3"><LogoutButton /></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
