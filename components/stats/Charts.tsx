import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Small hover tooltip shared by every mark; text stays in neutral ink. */
function Tip({ children }: { children: ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 translate-y-1 rounded-lg border border-white/10 bg-zinc-900/95 px-2.5 py-1.5 text-xs whitespace-nowrap text-white opacity-0 shadow-xl backdrop-blur transition duration-150 group-hover/mark:translate-y-0 group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100"
    >
      {children}
    </span>
  );
}

export function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6", className)}>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-white/45">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Vertical columns anchored to a shared baseline (single series, one hue). */
export function ColumnChart({ data, unit, height = 180 }: { data: { label: string; value: number; detail?: string }[]; unit: string; height?: number }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <figure>
      <div className="relative flex items-end gap-1.5 border-b border-white/10 sm:gap-2" style={{ height }}>
        {[0.5, 1].map((line) => (
          <span key={line} aria-hidden className="absolute inset-x-0 border-t border-dashed border-white/[0.06]" style={{ bottom: `${line * 100}%` }} />
        ))}
        {data.map((item, index) => (
          <div key={item.label} tabIndex={0} className="group/mark relative flex h-full flex-1 items-end outline-none">
            <Tip><b className="font-semibold">{item.value}</b> {unit} · {item.detail ?? item.label}</Tip>
            <span
              className="animate-grow-y block w-full origin-bottom rounded-t-[4px] bg-gradient-to-t from-violet-600 to-violet-400 transition group-hover/mark:from-violet-500 group-hover/mark:to-fuchsia-300"
              style={{ height: item.value ? `${Math.max(3, (item.value / max) * 100)}%` : "2px", opacity: item.value ? 1 : 0.25, animationDelay: `${index * 40}ms` }}
            />
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex gap-1.5 text-[11px] text-white/40 sm:gap-2">
        {data.map((item) => <span key={item.label} className="flex-1 text-center">{item.label}</span>)}
      </figcaption>
    </figure>
  );
}

/** Horizontal bars with the label and value on the bar row (direct labels). */
export function BarList({ data, unit }: { data: { label: string; value: number; detail?: string }[]; unit: string }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <ul className="space-y-3">
      {data.map((item, index) => (
        <li key={item.label} className="relative">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-white/80">{item.label}</span>
            <span className="shrink-0 text-white/50"><b className="font-semibold text-white">{item.value}</b>{item.detail ? <span className="ml-2 text-xs">{item.detail}</span> : null}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="animate-grow-x block h-full origin-left rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, animationDelay: `${index * 60}ms` }}
            />
          </div>
          <span className="sr-only">{item.value} {unit}</span>
        </li>
      ))}
    </ul>
  );
}

const HEAT_STEPS = ["bg-white/[0.05]", "bg-violet-900", "bg-violet-700", "bg-violet-500", "bg-violet-300"];

/** Week-by-day grid of activity, sequential single-hue ramp. */
export function Heatmap({ weeks, max }: { weeks: { date: string; count: number }[][]; max: number }) {
  const step = (count: number) => (count === 0 || max === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4)));
  return (
    <figure>
      <div className="flex gap-[3px] pt-10 pb-1 sm:gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex min-w-0 flex-1 flex-col gap-[3px] sm:gap-1">
            {week.map((day) => (
              <span key={day.date} tabIndex={0} className="group/mark relative block outline-none">
                <Tip><b className="font-semibold">{day.count}</b> {day.count === 1 ? "action" : "actions"} · {new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</Tip>
                <span className={cn("block aspect-square w-full max-w-7 rounded-[3px] ring-white/40 transition group-hover/mark:ring-1 sm:rounded-[4px]", HEAT_STEPS[step(day.count)])} />
              </span>
            ))}
          </div>
        ))}
      </div>
      <figcaption className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-white/40">
        Less {HEAT_STEPS.map((cls) => <span key={cls} className={cn("size-3 rounded-[3px]", cls)} />)} More
      </figcaption>
    </figure>
  );
}
