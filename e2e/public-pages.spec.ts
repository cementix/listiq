import { expect, test } from "@playwright/test";

test("public title pages work signed out and unknown slugs return a real 404", async ({ page }) => {
  const response = await page.goto("/title/e2e-anime-1");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "E2E Anime 1" })).toBeVisible();
  await expect(page).toHaveTitle(/E2E Anime 1/);

  const missing = await page.goto("/title/this-title-does-not-exist");
  expect(missing?.status()).toBe(404);
});
