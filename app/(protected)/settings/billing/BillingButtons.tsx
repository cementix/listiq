"use client";

import { ArrowRight, Loader2, Settings2, Sparkles } from "lucide-react";
import { useActionState } from "react";

import { openBillingPortal, startCheckout, type BillingState } from "@/actions/billing";

export function UpgradeButton({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState<BillingState>(startCheckout, { ok: true });
  return (
    <form action={action} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending || disabled}
        className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_12px_40px_-8px_rgba(167,139,250,0.8)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-violet-300/60 to-transparent animate-shimmer" />
        {pending ? <Loader2 className="relative size-4 animate-spin" /> : <Sparkles className="relative size-4 text-violet-600" />}
        <span className="relative">{pending ? "Opening checkout…" : "Upgrade to Pro"}</span>
        {!pending && <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-1" />}
      </button>
      {state.error ? <p role="alert" className="text-sm text-rose-300">{state.error}</p> : null}
    </form>
  );
}

export function ManageBillingButton() {
  const [state, action, pending] = useActionState<BillingState>(openBillingPortal, { ok: true });
  return (
    <form action={action} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Settings2 className="size-4" />}
        Manage subscription
      </button>
      {state.error ? <p role="alert" className="text-sm text-rose-300">{state.error}</p> : null}
    </form>
  );
}
