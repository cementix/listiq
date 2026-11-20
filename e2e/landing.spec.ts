import { expect, test } from "@playwright/test";

test("landing page leads a visitor to sign-up", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try the live demo" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Get started" }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("button", { name: "Register" })).toBeVisible();
});
