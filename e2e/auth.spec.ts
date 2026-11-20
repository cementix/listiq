import { expect, test } from "@playwright/test";

import { dismissPrivacyDialog, register } from "./helpers";

test("a new user can register, sign out and sign back in", async ({ page }) => {
  const account = await register(page);

  await page.getByRole("button", { name: /Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  // Protected pages bounce signed-out visitors back to sign-in.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  await page.getByPlaceholder("you@example.com").fill(account.email);
  await page.getByPlaceholder("*****************").fill(account.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await dismissPrivacyDialog(page);
  await expect(page.getByRole("button", { name: /Account menu/ })).toContainText(account.username);
});
