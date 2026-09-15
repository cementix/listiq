"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Dice5,
  Flame,
  Star,
} from "lucide-react";

type RailIcon = "flame" | "calendar" | "dice" | "star";

type DashboardRailProps = {
  title: string;
  href: string;
  icon: RailIcon;
  children: React.ReactNode;
};

const icons = {
  flame: Flame,
  calendar: CalendarDays,
  dice: Dice5,
  star: Star,
};

export default function DashboardRail({
  title,
  href,
  icon,
  children,
}: DashboardRailProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const Icon = icons[icon];

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    setCanScrollLeft(element.scrollLeft > 8);
    setCanScrollRight(
      element.scrollLeft + element.clientWidth < element.scrollWidth - 8,
    );
  }, []);

  useEffect(() => {
    updateScrollState();

    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;

    element.scrollBy({
      left:
        direction === "left"
          ? -Math.round(element.clientWidth * 0.85)
          : Math.round(element.clientWidth * 0.85),
      behavior: "smooth",
    });
  };

  return (
    <section className="group/rail relative">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm text-white/45 transition hover:translate-x-0.5 hover:text-white"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            className="absolute left-2 top-[108px] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white opacity-0 shadow-2xl backdrop-blur-md transition duration-200 hover:scale-110 hover:border-white/20 hover:bg-black/90 active:scale-95 group-hover/rail:opacity-100 sm:top-[120px] md:flex"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-3"
        >
          {children}
        </div>

        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            className="absolute right-2 top-[108px] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white opacity-0 shadow-2xl backdrop-blur-md transition duration-200 hover:scale-110 hover:border-white/20 hover:bg-black/90 active:scale-95 group-hover/rail:opacity-100 sm:top-[120px] md:flex"
          >
            <ArrowRight className="size-5" />
          </button>
        )}
      </div>
    </section>
  );
}
