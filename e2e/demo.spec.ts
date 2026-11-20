import { expect, test } from "@playwright/test";

test("one-click demo opens a pre-filled private sandbox", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the live demo" }).first().click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByText("You're exploring a private demo sandbox")).toBeVisible();

  // Guests are read-only for outward-facing actions, so billing must not offer checkout.
  await page.goto("/settings/billing");
  await expect(page.getByRole("heading", { name: "Plan & billing" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upgrade to Pro" })).toHaveCount(0);
});
