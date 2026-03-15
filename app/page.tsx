import Link from "next/link";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-10 pt-16 sm:px-10 sm:pt-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
      <div className="absolute inset-x-0 top-0 z-[-1] mx-auto h-32 max-w-3xl rounded-full bg-gradient-to-b from-white/60 to-transparent blur-3xl dark:from-slate-900/60" />

      <section className="space-y-8 lg:max-w-xl animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.35)]" />
          Designed for people who actually care how their lists feel
        </div>

        <div className="space-y-4">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            Minimal lists,
            <span className="relative ml-2 inline-flex items-center">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                maximal flow.
              </span>
              <span className="ml-1 h-5 w-[2px] animate-pulse rounded-full bg-gradient-to-b from-primary to-accent sm:h-6" />
            </span>
          </h1>

          <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
            listiq turns your everyday lists into a calm, animated canvas. No
            visual noise, just fluid motion, soft gradients, and the tiniest
            micro‑interactions that make checking things off feel good again.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_14px_40px_rgba(55,48,163,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_18px_55px_rgba(55,48,163,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span>Start a clean list</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/10 text-[10px] transition-transform duration-200 group-hover:translate-x-[2px]">
              ↗
            </span>
          </Link>

          <button className="inline-flex items-center gap-2 rounded-full border border-dashed border-border/70 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:border-muted-foreground/30 hover:bg-muted/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            See how the motion feels
          </button>
        </div>

        <dl className="grid grid-cols-3 gap-4 text-xs text-muted-foreground sm:max-w-md sm:text-sm">
          <div className="card-ambient rounded-2xl border border-border/70 bg-card/80 px-3 py-3">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
              Latency
            </dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">
              16&nbsp;ms
            </dd>
          </div>
          <div className="card-ambient rounded-2xl border border-border/70 bg-card/80 px-3 py-3">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
              Animations
            </dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">
              Micro, not noisy
            </dd>
          </div>
          <div className="card-ambient rounded-2xl border border-border/70 bg-card/80 px-3 py-3">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
              Vibe
            </dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">
              Calm focus
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 flex flex-1 justify-center animate-in fade-in slide-in-from-right-4 duration-500 delay-100 lg:mt-0">
        <div className="relative w-full max-w-md">
          <div className="card-ambient relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-4 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400/80" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                </span>
                Today · Lists
              </span>
              <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]">
                Motion preview
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                "Ship onboarding flow",
                "Clean up design tokens",
                "Write release notes",
              ].map((label, index) => (
                <button
                  key={label}
                  className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 px-3.5 py-2.5 text-left text-xs text-foreground/90 transition-all duration-200 hover:-translate-y-[1px] hover:border-accent/60 hover:bg-gradient-to-r hover:from-background/90 hover:to-accent/8"
                >
                  <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card/80">
                    <span className="absolute inset-[-3px] rounded-full border border-primary/0 opacity-0 transition-all duration-200 group-hover:border-primary/40 group-hover:opacity-100" />
                    <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-tr from-primary to-accent opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[11px] font-medium">
                      {label}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground/80">
                      {index === 0
                        ? "Tiny micro-delays that feel buttery, not slow."
                        : index === 1
                          ? "Minimal UI, but every token is deliberate."
                          : "Even documentation feels a bit more alive."}
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 group-hover:text-primary">
                    {index === 0 ? "Now" : index === 1 ? "Next" : "Later"}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-border/90 bg-gradient-to-r from-background/90 via-background/60 to-accent/10 px-3.5 py-2.5 text-[11px] text-muted-foreground">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.28)]" />
                  <span className="font-medium text-foreground/90">
                    Flow state unlocked
                  </span>
                </div>
                <p className="mt-0.5 text-[10px]">
                  Micro‑animations guide your eye without stealing attention.
                </p>
              </div>
              <span className="rounded-full bg-card/90 px-2 py-1 text-[10px] font-medium text-foreground">
                3 of 5 done
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
