import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Shared page intro with a soft glow, grid texture and entrance animation. */
export default function PageHeader({ eyebrow, title, description, icon, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent p-5 animate-in fade-in slide-in-from-bottom-2 duration-700 sm:p-8",
        className,
      )}
    >
      <div aria-hidden className="absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.35),transparent)] animate-glow" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top_right,#000,transparent_65%)]" />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300/80 uppercase">
            {icon}
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
          {description ? <p className="mt-3 max-w-xl text-pretty text-white/60">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
