"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireUserServer } from "@/lib/auth/guards";
import { assertNotGuest } from "@/lib/demo/guest";
import { getStripe, PRO_PRICE_CENTS } from "@/lib/billing/stripe";
import { logError } from "@/lib/observability/errors";
import { prisma } from "@/lib/prisma";
import { securityErrorMessage } from "@/lib/security/errors";

export type BillingState = { ok: boolean; error?: string };

async function origin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

async function ensureCustomer(userId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Billing is not configured");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, username: true, stripeCustomerId: true },
  });
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({ email: user.email, name: user.username, metadata: { userId } });
  // Only claim the customer if another request has not already done so.
  await prisma.user.updateMany({ where: { id: userId, stripeCustomerId: null }, data: { stripeCustomerId: customer.id } });
  const saved = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { stripeCustomerId: true } });
  return saved.stripeCustomerId ?? customer.id;
}

export async function startCheckout(): Promise<BillingState> {
  let url: string | null = null;
  try {
    const { session } = await requireUserServer();
    await assertNotGuest(session.userId, "subscribe");
    const stripe = getStripe();
    if (!stripe) return { ok: false, error: "Billing is not configured on this deployment." };

    const customer = await ensureCustomer(session.userId);
    const base = await origin();
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: session.userId,
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: PRO_PRICE_CENTS,
                recurring: { interval: "month" },
                product_data: { name: "Listiq Pro" },
              },
            },
      ],
      subscription_data: { metadata: { userId: session.userId } },
      allow_promotion_codes: true,
      success_url: `${base}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/settings/billing?checkout=cancelled`,
    });
    url = checkout.url;
  } catch (error) {
    logError("actions.billing.startCheckout", error);
    return { ok: false, error: securityErrorMessage(error, "Couldn't open checkout. Please try again.") };
  }
  if (!url) return { ok: false, error: "Couldn't open checkout. Please try again." };
  redirect(url);
}

export async function openBillingPortal(): Promise<BillingState> {
  let url: string | null = null;
  try {
    const { session } = await requireUserServer();
    const stripe = getStripe();
    if (!stripe) return { ok: false, error: "Billing is not configured on this deployment." };
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { stripeCustomerId: true } });
    if (!user?.stripeCustomerId) return { ok: false, error: "No subscription to manage yet." };
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${await origin()}/settings/billing`,
    });
    url = portal.url;
  } catch (error) {
    logError("actions.billing.openBillingPortal", error);
    return { ok: false, error: "Couldn't open the billing portal. Please try again." };
  }
  redirect(url);
}
