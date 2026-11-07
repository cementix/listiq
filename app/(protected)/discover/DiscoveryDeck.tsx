"use client";

import { logError } from "@/lib/observability/errors";

import Image from "next/image";
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
}: {
  initialCards: DiscoveryTitle[];
}) {
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
        toast.error(result.error);
        setDragX(0);
        return;
      }

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

  return (
    <section className="flex flex-col items-center">
      <div className="flex w-full max-w-4xl items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Discover</h1>

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

      <div className="mt-6 grid w-full max-w-[430px] grid-cols-3 gap-2">
        <button
          type="button"
          disabled={!current || busy}
          onClick={() => void choose("skip")}
          className="flex h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 text-sm hover:bg-white/10 disabled:opacity-40"
        >
          <X className="size-4" />
          Skip
        </button>
        <button
          type="button"
          disabled={!current || busy}
          onClick={() => void choose("library")}
          className="flex h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 text-sm hover:bg-white/10 disabled:opacity-40"
        >
          <LibraryBig className="size-4" />
          Library
        </button>
        <button
          type="button"
          disabled={!current || busy}
          onClick={() => void choose("for-later")}
          className="flex h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 text-sm hover:bg-white/10 disabled:opacity-40"
        >
          <BookmarkPlus className="size-4" />
          For later
        </button>
      </div>
    </section>
  );
}
