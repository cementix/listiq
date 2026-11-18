import type { Metadata } from "next";
import { Check, CreditCard, FlaskConical, Sparkles } from "lucide-react";

import PageHeader from "@/components/custom/PageHeader";
import PageSection from "@/components/custom/PageSection";
import { Plan } from "@/generated/prisma/enums";
import { requireAuth } from "@/lib/auth/guards";
import { confirmCheckoutSession, isBillingEnabled, PRO_FEATURES, PRO_PRICE_CENTS } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import { ManageBillingButton, UpgradeButton } from "./BillingButtons";

export const metadata: Metadata = { title: "Plan & billing" };

type Props = { searchParams: Promise<{ checkout?: string; session_id?: string }> };

export default async function BillingPage({ searchParams }: Props) {
  const session = await requireAuth();
  const params = await searchParams;
  if (params.checkout === "success" && params.session_id) {
    await confirmCheckoutSession(params.session_id, session.userId);
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { plan: true, subscriptionStatus: true, currentPeriodEnd: true, isGuest: true },
  });
  const enabled = isBillingEnabled();
  const isPro = user.plan === Plan.PRO;
  const renews = user.currentPeriodEnd?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <PageSection className="mx-auto w-full max-w-6xl px-4 lg:px-6">
      <PageHeader
        eyebrow="Billing"
        title={isPro ? <>You&apos;re on <span className="font-display font-normal italic text-gradient">Pro</span></> : "Plan & billing"}
        description={isPro ? `Thanks for supporting Listiq.${renews ? ` Your plan renews on ${renews}.` : ""}` : "Listiq is free forever. Pro adds imports and deeper insights."}
        icon={<CreditCard className="size-3.5" />}
      />

      {params.checkout === "success" && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 animate-in fade-in slide-in-from-top-2">
          <Check className="size-4" /> {isPro ? "Payment confirmed — Pro is active." : "Payment received. Your plan will update in a moment."}
        </div>
      )}
      {params.checkout === "cancelled" && (
        <div role="status" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">Checkout cancelled — you haven&apos;t been charged.</div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] px-4 py-3 text-sm text-amber-100/90">
        <FlaskConical className="mt-0.5 size-4 shrink-0" />
        <p>
          Billing runs in <b>Stripe test mode</b> — no real money moves. Use card <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">4242 4242 4242 4242</code>, any future expiry and any CVC.
          {!enabled && " Billing isn't configured on this deployment yet."}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={`relative overflow-hidden rounded-3xl border p-7 ${isPro ? "border-white/10 bg-white/[0.02]" : "border-white/20 bg-white/[0.04]"}`}>
          {!isPro && <span className="absolute top-6 right-6 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">Current plan</span>}
          <p className="text-sm font-semibold text-white">Free</p>
          <p className="mt-4 text-5xl font-semibold tracking-tight">$0</p>
          <ul className="mt-6 space-y-3 text-sm text-white/70">
            {["Unlimited library, ratings & reviews", "Lists and profiles", "Discover — 30 picks a day", "Core insights"].map((item) => (
              <li key={item} className="flex gap-3"><Check className="mt-0.5 size-4 text-white/50" />{item}</li>
            ))}
          </ul>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-violet-400/40 bg-gradient-to-b from-violet-500/[0.14] to-transparent p-7">
          <div aria-hidden className="absolute -top-24 -right-24 size-64 rounded-full bg-violet-500/30 blur-3xl animate-glow" />
          {isPro && <span className="absolute top-6 right-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-[11px] font-semibold text-white">Current plan</span>}
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="size-4 text-violet-300" />Pro</p>
          <p className="mt-4 flex items-baseline gap-2"><span className="text-5xl font-semibold tracking-tight">${(PRO_PRICE_CENTS / 100).toFixed(0)}</span><span className="text-sm text-white/60">per month</span></p>
          <ul className="relative mt-6 space-y-3 text-sm text-white/80">
            {PRO_FEATURES.map((item) => (
              <li key={item} className="flex gap-3"><span className="mt-0.5 grid size-4 place-items-center rounded-full bg-violet-400/25"><Check className="size-3 text-violet-200" /></span>{item}</li>
            ))}
          </ul>
          <div className="relative mt-8">
            {isPro ? (
              <ManageBillingButton />
            ) : user.isGuest ? (
              <p className="text-sm text-white/60">Create a free account to try Pro checkout.</p>
            ) : (
              <UpgradeButton disabled={!enabled} />
            )}
          </div>
          {user.subscriptionStatus && user.subscriptionStatus !== "active" && (
            <p className="relative mt-3 text-xs text-white/55">Subscription status: {user.subscriptionStatus.replace("_", " ")}</p>
          )}
        </section>
      </div>
    </PageSection>
  );
}
