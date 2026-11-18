"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { BarChart3, BookOpen, Compass, CornerDownLeft, Home, List, Loader2, Plus, Search, Settings, Sparkles, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { quickSearch, type QuickSearchResult } from "@/actions/search/quickSearch";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const EMPTY: QuickSearchResult = { titles: [], lists: [], people: [] };

const TYPE_LABEL: Record<string, string> = {
  MOVIE: "Movie", SERIES: "Series", ANIME: "Anime", MANGA: "Manga", MANHWA: "Manhwa",
  BOOK: "Book", GAME: "Game", NOVEL: "Novel", COMIC: "Comic", OTHER: "Title",
};

const itemClass =
  "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 outline-none transition-colors data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-white";
const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-white/35 [&_[cmdk-group-heading]]:uppercase";

export function openCommandPalette() {
  window.dispatchEvent(new Event("listiq:command-palette"));
}

export default function CommandPalette({ username }: { username: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickSearchResult>(EMPTY);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("listiq:command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("listiq:command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const timeout = window.setTimeout(() => {
      startTransition(async () => setResults(await quickSearch(trimmed)));
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const visibleResults = query.trim().length < 2 ? EMPTY : results;

  const pages = useMemo(() => [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Browse titles", href: "/titles", icon: BookOpen },
    { label: "Discover", href: "/discover", icon: Compass },
    { label: "Your insights", href: "/stats", icon: BarChart3 },
    { label: "My lists", href: "/my-lists", icon: List },
    { label: "Browse public lists", href: "/lists", icon: Sparkles },
    { label: "Add a title", href: "/add-title", icon: Plus },
    { label: "My profile", href: `/users/${username}`, icon: UserRound },
    { label: "Settings", href: "/settings/profile", icon: Settings },
  ], [username]);

  const filteredPages = pages.filter((page) => page.label.toLowerCase().includes(query.trim().toLowerCase()));

  const go = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  }, [router]);

  const hasResults = visibleResults.titles.length + visibleResults.lists.length + visibleResults.people.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="top-[15%] translate-y-0 overflow-hidden border-white/10 bg-zinc-950/95 p-0 text-white shadow-[0_40px_120px_-20px_rgba(0,0,0,1)] backdrop-blur-2xl sm:max-w-xl">
        <DialogTitle className="sr-only">Search Listiq</DialogTitle>
        <DialogDescription className="sr-only">Search titles, lists and people, or jump to a page.</DialogDescription>
        <Command shouldFilter={false} loop className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-white/10 px-4">
            {pending ? <Loader2 className="size-4 shrink-0 animate-spin text-violet-300" /> : <Search className="size-4 shrink-0 text-white/40" />}
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search titles, lists, people…"
              className="h-14 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35 focus-visible:outline-none"
            />
            <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">ESC</kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            {query.trim().length >= 2 && !pending && !hasResults && filteredPages.length === 0 && (
              <Command.Empty className="px-3 py-10 text-center text-sm text-white/45">No matches for “{query.trim()}”.</Command.Empty>
            )}

            {visibleResults.titles.length > 0 && (
              <Command.Group heading="Titles" className={groupClass}>
                {visibleResults.titles.map((title) => (
                  <Command.Item key={title.id} value={`title-${title.id}`} onSelect={() => go(`/titles/${title.slug}`)} className={itemClass}>
                    <span className="relative h-10 w-7 shrink-0 overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10">
                      {title.imageUrl && <Image src={title.imageUrl} alt="" fill sizes="28px" className="object-cover" unoptimized />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-white">{title.name}</span>
                      <span className="text-xs text-white/40">{TYPE_LABEL[title.type] ?? title.type}{title.year ? ` · ${title.year}` : ""}</span>
                    </span>
                    <CornerDownLeft className="size-3.5 text-white/0 group-data-[selected=true]:text-white/40" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {visibleResults.lists.length > 0 && (
              <Command.Group heading="Lists" className={groupClass}>
                {visibleResults.lists.map((list) => (
                  <Command.Item key={list.id} value={`list-${list.id}`} onSelect={() => go(`/lists/${list.owner}/${list.slug}`)} className={itemClass}>
                    <span className="grid size-8 place-items-center rounded-lg bg-violet-500/15 text-violet-300"><List className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-white">{list.title}</span>
                      <span className="text-xs text-white/40">@{list.owner} · {list.count} titles</span>
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {visibleResults.people.length > 0 && (
              <Command.Group heading="People" className={groupClass}>
                {visibleResults.people.map((person) => (
                  <Command.Item key={person.username} value={`user-${person.username}`} onSelect={() => go(`/users/${person.username}`)} className={itemClass}>
                    <span className="relative grid size-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-fuchsia-400/40 to-violet-500/40 text-xs font-semibold text-white">
                      {person.avatarUrl ? <Image src={person.avatarUrl} alt="" fill sizes="32px" className="object-cover" unoptimized /> : person.username.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="truncate font-medium text-white">@{person.username}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {filteredPages.length > 0 && (
              <Command.Group heading="Jump to" className={groupClass}>
                {filteredPages.map(({ label, href, icon: Icon }) => (
                  <Command.Item key={href} value={`page-${href}`} onSelect={() => go(href)} className={itemClass}>
                    <Icon className="size-4 text-white/45 group-data-[selected=true]:text-violet-300" />
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-[11px] text-white/35">
            <span>↑↓ to navigate · ↵ to open</span>
            <span className="flex items-center gap-1"><Sparkles className="size-3 text-violet-300" /> Listiq search</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
