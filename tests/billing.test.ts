import assert from "node:assert/strict";
import { test } from "node:test";
import Stripe from "stripe";

// Fake test-mode credentials: never real keys. Set before the billing module loads.
process.env.STRIPE_SECRET_KEY = "sk_test_listiq_unit";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_listiq_unit";

const billing = await import("../lib/billing/stripe");
const { POST } = await import("../app/api/stripe/webhook/route");

test("only active, trialing and past-due subscriptions grant Pro", () => {
  assert.equal(billing.planForStatus("active"), "PRO");
  assert.equal(billing.planForStatus("trialing"), "PRO");
  assert.equal(billing.planForStatus("past_due"), "PRO");
  for (const status of ["canceled", "incomplete", "incomplete_expired", "unpaid", "paused", null, undefined]) {
    assert.equal(billing.planForStatus(status), "FREE", String(status));
  }
});

test("period end is read from the first subscription item", () => {
  const items = { data: [{ current_period_end: 1_800_000_000 }] } as unknown as Stripe.Subscription["items"];
  assert.equal(billing.periodEnd({ items })?.toISOString(), new Date(1_800_000_000_000).toISOString());
  assert.equal(billing.periodEnd({ items: { data: [] } as unknown as Stripe.Subscription["items"] }), null);
});

test("test-mode keys enable billing", () => {
  assert.equal(billing.isBillingEnabled(), true);
});

test("webhook rejects missing and forged signatures", async () => {
  const body = JSON.stringify({ id: "evt_1", object: "event", type: "invoice.paid", data: { object: {} } });
  const missing = await POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body }));
  assert.equal(missing.status, 400);
  const forged = await POST(new Request("http://localhost/api/stripe/webhook", {
    method: "POST", body, headers: { "stripe-signature": "t=1,v1=deadbeef" },
  }));
  assert.equal(forged.status, 400);
});

test("webhook accepts a correctly signed event", async () => {
  const body = JSON.stringify({ id: "evt_2", object: "event", type: "invoice.paid", data: { object: {} } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: "whsec_listiq_unit" });
  const response = await POST(new Request("http://localhost/api/stripe/webhook", {
    method: "POST", body, headers: { "stripe-signature": signature },
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, received: "invoice.paid" });
});
