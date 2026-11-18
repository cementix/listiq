"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export default function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 24));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6"
    >
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border px-3 pl-5 transition-all duration-500",
          scrolled
            ? "border-white/10 bg-black/60 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-400 via-fuchsia-400 to-sky-400 text-[13px] font-bold text-black">
            l
          </span>
          listiq
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="rounded-full px-3.5 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/login" className="rounded-full px-3.5 py-2 text-sm text-white/70 transition hover:text-white">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
          >
            Get started
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
