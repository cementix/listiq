"use client";

import { logError } from "@/lib/observability/errors";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookmarkPlus, LibraryBig, X } from "lucide-react";
import { toast } from "sonner";

import { getDiscoveryCandidates } from "@/actions/discovery/getDiscoveryCandidates";
import { markDiscoveryShown } from "@/actions/discovery/markDiscoveryShown";
import { saveDiscoveryTitle } from "@/actions/discovery/saveDiscoveryTitle";
import { skipDiscoveryTitle } from "@/actions/discovery/skipDiscoveryTitle";
import { TitleType } from "@/generated/prisma/enums";
import TitleSourceLinks from "@/components/custom/TitleSourceLinks";

type DiscoveryTitle = Awaited<
  ReturnType<typeof getDiscoveryCandidates>
>[number];

type Choice = "skip" | "library" | "for-later";

const typeOptions: { value: TitleType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All types" },
  { value: "MOVIE", label: "Movies" },
  { value: "SERIES", label: "Series" },
  { value: "ANIME", label: "Anime" },
  { value: "MANGA", label: "Manga" },
  { value: "MANHWA", label: "Manhwa" },
  { value: "BOOK", label: "Books" },
  { value: "GAME", label: "Games" },
  { value: "NOVEL", label: "Novels" },
  { value: "COMIC", label: "Comics" },
  { value: "OTHER", label: "Other" },
];

function DeckCard({
  title,
  position,
  advancing,
  dragX,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  title: DiscoveryTitle;
  position: "previous" | "current" | "next";
  advancing: boolean;
  dragX: number;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
}) {
  const centered = position === "next" ? advancing : position === "current" && !advancing;
  const left = position === "previous" || (position === "current" && advancing);
  const offset = position === "current" && !advancing ? dragX : 0;

  return (
    <article
      aria-hidden={position !== "current"}
      onPointerDown={position === "current" ? onPointerDown : undefined}
      onPointerMove={position === "current" ? onPointerMove : undefined}
      onPointerUp={position === "current" ? onPointerUp : undefined}
      onPointerCancel={position === "current" ? onPointerCancel : undefined}
      className="absolute left-1/2 top-1/2 h-full w-[min(78vw,350px)] overflow-hidden rounded-xl border border-white/15 bg-neutral-900 shadow-2xl motion-reduce:!transition-none"
      style={{
        transform: centered
          ? `translate(calc(-50% + ${offset}px), -50%) rotate(${offset / 25}deg)`
          : left
            ? "translate(calc(-50% - min(32vw, 230px)), -50%) scale(0.82)"
            : "translate(calc(-50% + min(32vw, 230px)), -50%) scale(0.82)",
        opacity: centered ? 1 : 0.55,
        filter: centered ? "none" : "brightness(0.5) blur(2px)",
        zIndex: position === "current" ? 20 : position === "next" && advancing ? 10 : 0,
        pointerEvents: position === "current" && !advancing ? "auto" : "none",
        cursor: position === "current" && !advancing ? "grab" : "default",
        touchAction: "pan-y",
        transition:
          position === "current" && dragX !== 0 && !advancing
            ? "none"
            : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease, filter 320ms ease",
      }}
    >
      {title.imageUrl && (
        <Image
          src={title.imageUrl}
          alt={position === "current" ? title.name : ""}
          fill
          priority={position === "current"}
          draggable={false}
          sizes="(max-width: 640px) 72vw, 350px"
          className="object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <p className="text-xs uppercase text-white/65">
          {title.type.replaceAll("_", " ")}
          {title.year ? ` · ${title.year}` : ""}
        </p>

        <Link
          href={`/titles/${title.slug}`}
          tabIndex={position === "current" && !advancing ? 0 : -1}
          onPointerDown={(event) => event.stopPropagation()}
          className="mt-2 inline-flex max-w-full break-words items-start gap-2 text-xl font-semibold leading-tight hover:underline sm:text-2xl"
        >
          {title.name}
          <ArrowUpRight className="mt-1 size-4 shrink-0" />
        </Link>
        {position === "current" && <TitleSourceLinks sources={title.externalTitles} />}

        <p className="mt-2 line-clamp-3 text-sm text-white/75">
          {title.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {title.genres.slice(0, 3).map((genre) => (
            <span
              key={genre.id}
              className="rounded border border-white/20 bg-black/40 px-2 py-1 text-xs"
            >
              {genre.name}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function DiscoveryDeck({
  initialCards,
  remainingToday = null,
  dailyLimit = null,
}: {
  initialCards: DiscoveryTitle[];
  /** Free members' remaining Discover choices today; null means unlimited. */
  remainingToday?: number | null;
  dailyLimit?: number | null;
}) {
  const [remaining, setRemaining] = useState(remainingToday);
  const [cards, setCards] = useState(initialCards);
  const [previous, setPrevious] = useState<DiscoveryTitle | null>(null);
  const [selectedType, setSelectedType] = useState<TitleType | "ALL">("ALL");
  const [busy, setBusy] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  const shownIds = useRef(new Set<string>());
  const pointerStartX = useRef<number | null>(null);
  const dragXRef = useRef(0);
  const busyRef = useRef(false);

  const current = cards[0] ?? null;
  const next = cards[1] ?? null;

  useEffect(() => {
    if (!current || shownIds.current.has(current.id)) return;

    shownIds.current.add(current.id);

    // Only the centered card counts as an impression.
    void markDiscoveryShown(current.id).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
      }
    }).catch(() => toast.error("Couldn't record this recommendation."));
  }, [current]);

  async function choose(choice: Choice) {
    if (!current || busyRef.current) return;
    busyRef.current = true;

    setBusy(true);
    dragXRef.current = 0;

    try {
      const result =
        choice === "skip"
          ? await skipDiscoveryTitle(current.id)
          : await saveDiscoveryTitle({
              titleId: current.id,
              destination: choice === "library" ? "library" : "for-later",
            });

      if (!result.ok) {
        if (result.error.startsWith("You've used today's")) setRemaining(0);
        else toast.error(result.error);
        setDragX(0);
        return;
      }
      setRemaining((value) => (value === null ? null : Math.max(0, value - 1)));

      setAdvancing(true);
      await new Promise((resolve) => setTimeout(resolve, 330));

      const remaining = cards.slice(1);
      setPrevious(current);
      setCards(remaining);
      setDragX(0);
      setAdvancing(false);

      if (remaining.length < 4) {
        const more = await getDiscoveryCandidates({
          type: selectedType === "ALL" ? null : selectedType,
          excludeIds: [
            ...shownIds.current,
            ...remaining.map((title) => title.id),
          ],
        });

        setCards((existing) => {
          const ids = new Set(existing.map((title) => title.id));
          return [...existing, ...more.filter((title) => !ids.has(title.id))];
        });
      }
    } catch (error) {
      logError("app.(protected).discover.DiscoveryDeck", error);
      toast.error("Something went wrong");
      setDragX(0);
      setAdvancing(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function changeType(value: TitleType | "ALL") {
    if (busyRef.current || value === selectedType) return;
    busyRef.current = true;

    setBusy(true);

    try {
      const nextCards = await getDiscoveryCandidates({
        type: value === "ALL" ? null : value,
        excludeIds: [...shownIds.current],
      });

      setSelectedType(value);
      setPrevious(null);
      setCards(nextCards);
      setDragX(0);
      setAdvancing(false);
    } catch (error) {
      logError("app.(protected).discover.DiscoveryDeck", error);
      toast.error("Failed to load recommendations");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (busy || (event.target as HTMLElement).closest("a")) return;

    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (pointerStartX.current === null || busy) return;

    dragXRef.current = Math.max(
      -160,
      Math.min(160, event.clientX - pointerStartX.current),
    );
    setDragX(dragXRef.current);
  }

  function onPointerUp() {
    if (pointerStartX.current === null) return;

    pointerStartX.current = null;
    const distance = dragXRef.current;
    dragXRef.current = 0;

    if (distance < -90) void choose("skip");
    else if (distance > 90) void choose("for-later");
    else setDragX(0);
  }

  // Keyboard shortcuts: ← skip, ↑ add to library, → save for later.
  const chooseRef = useRef(choose);
  useEffect(() => {
    chooseRef.current = choose;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (target instanceof Element && target.closest("input, textarea, select, [role=dialog], [contenteditable=true]")) return;
      const choice = event.key === "ArrowLeft" ? "skip" : event.key === "ArrowRight" ? "for-later" : event.key === "ArrowUp" ? "library" : null;
      if (!choice) return;
      event.preventDefault();
      void chooseRef.current(choice);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ambient = cards[0]?.imageUrl ?? null;

  return (
    <section className="relative isolate flex flex-col items-center">
      {/* Ambient glow that follows the card on top of the deck. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-[-20%] -top-24 -z-10 h-[680px] overflow-hidden [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_70%)]">
        <AnimatePresence initial={false}>
          {ambient && (
            <motion.div
              key={ambient}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.55, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image src={ambient} alt="" fill sizes="100vw" className="object-cover blur-3xl saturate-150" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex w-full max-w-4xl items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Discover</h1>
          <p className="mt-1 text-sm text-white/50">Swipe right to save for later, left to skip.</p>
          {remaining !== null && dailyLimit !== null && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500" style={{ width: `${(remaining / dailyLimit) * 100}%` }} />
              </span>
              {remaining} of {dailyLimit} free picks left today
            </p>
          )}
        </div>

        <select
          aria-label="Title type"
          value={selectedType}
          disabled={busy}
          onChange={(event) =>
            void changeType(event.target.value as TitleType | "ALL")
          }
          className="h-11 max-w-[55%] rounded-lg border border-white/15 bg-neutral-900 px-3 text-base sm:text-sm text-white outline-none focus:border-white/40"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative mt-4 h-[clamp(280px,calc(100dvh-310px),520px)] w-full max-w-[900px] overflow-hidden sm:mt-6">
        {[
          previous && { title: previous, position: "previous" as const },
          next && { title: next, position: "next" as const },
          current && { title: current, position: "current" as const },
        ]
          .filter((card): card is NonNullable<typeof card> => card !== null)
          .map(({ title, position }) => (
            <DeckCard
              key={title.id}
              title={title}
              position={position}
              advancing={advancing}
              dragX={dragX}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                pointerStartX.current = null;
                dragXRef.current = 0;
                setDragX(0);
              }}
            />
          ))}

        {!current && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/55">
            {busy ? "Loading..." : "No recommendations right now"}
          </div>
        )}
      </div>

      {remaining === 0 && (
        <div role="status" className="mt-6 flex w-full max-w-[460px] flex-col items-center gap-3 rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-transparent p-6 text-center animate-in fade-in slide-in-from-bottom-2">
          <p className="text-lg font-semibold">That&apos;s today&apos;s free picks</p>
          <p className="text-sm text-white/65">Pro unlocks unlimited Discover — billing runs in Stripe test mode, so no real money moves.</p>
          <Link href="/settings/billing" className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:-translate-y-0.5">See Pro</Link>
        </div>
      )}
      <div className="mt-6 grid w-full max-w-[460px] grid-cols-3 gap-2">
        {([
          { choice: "skip", label: "Skip", icon: X, key: "←", tone: "hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-100" },
          { choice: "library", label: "Library", icon: LibraryBig, key: "↑", tone: "hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-100" },
          { choice: "for-later", label: "For later", icon: BookmarkPlus, key: "→", tone: "hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-100" },
        ] as const).map(({ choice, label, icon: Icon, key, tone }) => (
          <button
            key={choice}
            type="button"
            disabled={!current || busy || remaining === 0}
            onClick={() => void choose(choice)}
            aria-keyshortcuts={key === "←" ? "ArrowLeft" : key === "→" ? "ArrowRight" : "ArrowUp"}
            className={`group flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 text-sm transition active:scale-95 disabled:opacity-40 ${tone}`}
          >
            <Icon className="size-4 transition-transform group-hover:scale-110" />
            {label}
            <kbd aria-hidden className="hidden rounded border border-white/15 px-1 text-[10px] text-white/60 sm:inline">{key}</kbd>
          </button>
        ))}
      </div>
      <p className="mt-3 hidden text-xs text-white/50 sm:block">Swipe the card or use your arrow keys.</p>
    </section>
  );
}
