import type Stripe from "stripe";

import { getStripe, syncSubscription } from "@/lib/billing/stripe";
import { logError } from "@/lib/observability/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBSCRIPTION_EVENTS = new Set<Stripe.Event.Type>([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return Response.json({ ok: false, error: "billing disabled" }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ ok: false }, { status: 400 });

  let event: Stripe.Event;
  try {
    // The raw body is required for signature verification.
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return Response.json({ ok: false, error: "invalid signature" }, { status: 400 });
  }

  try {
    if (SUBSCRIPTION_EVENTS.has(event.type)) {
      await syncSubscription(event.data.object as Stripe.Subscription);
    } else if (event.type === "checkout.session.completed") {
      const checkout = event.data.object as Stripe.Checkout.Session;
      if (typeof checkout.subscription === "string") {
        await syncSubscription(await stripe.subscriptions.retrieve(checkout.subscription));
      }
    }
  } catch (error) {
    logError("api.stripe.webhook", error);
    // Ask Stripe to retry; the handlers are idempotent.
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true, received: event.type });
}
