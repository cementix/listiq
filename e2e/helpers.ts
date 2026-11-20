import { expect, type Page } from "@playwright/test";

export type TestAccount = { email: string; username: string; password: string };

export function newAccount(prefix = "e2e"): TestAccount {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    email: `${prefix}-${id}@listiq.test`,
    username: `${prefix}_${id}`.slice(0, 24),
    password: `E2e-password-${id}!`,
  };
}

/** New accounts see a one-time privacy dialog; accept the defaults so it doesn't cover the page. */
export async function dismissPrivacyDialog(page: Page) {
  const save = page.getByRole("button", { name: "Save preferences" });
  if (await save.isVisible().catch(() => false)) {
    await save.click();
    await expect(save).toBeHidden();
  }
}

export async function register(page: Page, account: TestAccount = newAccount()) {
  await page.goto("/register");
  await page.getByPlaceholder("you@example.com").fill(account.email);
  await page.getByPlaceholder("leonKennedyFan").fill(account.username);
  await page.getByPlaceholder("*****************").fill(account.password);
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await dismissPrivacyDialog(page);
  return account;
}
