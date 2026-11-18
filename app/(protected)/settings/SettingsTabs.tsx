"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { CreditCard, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings/profile", label: "Profile", icon: UserRound },
  { href: "/settings/billing", label: "Plan & billing", icon: CreditCard },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="mx-auto flex w-full max-w-6xl gap-1 px-4 pt-6 lg:px-6">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("relative isolate flex h-10 items-center gap-2 rounded-full px-4 text-sm text-white/55 transition-colors hover:text-white", active && "text-white")}
          >
            {active && <motion.span layoutId="settings-tab" className="absolute inset-0 -z-10 rounded-full bg-white/[0.08] ring-1 ring-white/10" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
