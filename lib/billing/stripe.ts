import "server-only";

import Stripe from "stripe";

import { Plan } from "@/generated/prisma/enums";
import { logError } from "@/lib/observability/errors";
import { prisma } from "@/lib/prisma";

export const PRO_PRICE_CENTS = 400;
export const PRO_FEATURES = [
  "Import your history from Letterboxd, MyAnimeList, Goodreads or any CSV",
  "Full insights: decades, genres, streaks and hall of fame",
  "Pro badge on your profile",
  "Support an independent project",
] as const;

let client: Stripe | null | undefined;

/**
 * Listiq runs billing in Stripe **test mode** only. A live key is rejected so a
 * misconfigured deployment can never charge real cards.
 */
export function getStripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key && key.startsWith("sk_test_") ? new Stripe(key, { typescript: true }) : null;
  return client;
}

export function isBillingEnabled() {
  return getStripe() !== null;
}

/** Subscription statuses that grant Pro access. */
export function planForStatus(status: string | null | undefined): Plan {
  return status === "active" || status === "trialing" || status === "past_due" ? Plan.PRO : Plan.FREE;
}

export function periodEnd(subscription: Pick<Stripe.Subscription, "items">): Date | null {
  const end = subscription.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000) : null;
}

/** Mirrors a Stripe subscription onto the member it belongs to. */
export async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const userId = subscription.metadata?.userId;
  const where = userId ? { id: userId } : { stripeCustomerId: customerId };
  const ended = subscription.status === "canceled" || subscription.status === "incomplete_expired";

  await prisma.user.updateMany({
    where,
    data: {
      plan: planForStatus(subscription.status),
      stripeCustomerId: customerId,
      stripeSubscriptionId: ended ? null : subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: periodEnd(subscription),
    },
  });
}

export async function isProUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  return user?.plan === Plan.PRO;
}

/**
 * Called when Checkout redirects back, so the plan updates immediately even
 * before (or without) the webhook arriving. Only syncs the caller's own session.
 */
export async function confirmCheckoutSession(sessionId: string, userId: string) {
  const stripe = getStripe();
  if (!stripe || !/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) return;
  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    if (checkout.client_reference_id !== userId || !checkout.subscription || typeof checkout.subscription === "string") return;
    await syncSubscription(checkout.subscription);
  } catch (error) {
    logError("actions.billing.confirmCheckoutSession", error);
  }
}
