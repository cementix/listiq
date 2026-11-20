import { expect, test } from "@playwright/test";

import { register } from "./helpers";

test("a signed-in user can add a title to the library and rate it", async ({ page }) => {
  await register(page);
  await page.goto("/titles/e2e-movie-1");

  await expect(page.getByRole("heading", { level: 1, name: "E2E Movie 1" })).toBeVisible();
  await expect(page.getByText("Not in your library yet")).toBeVisible();

  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Saved in your library")).toBeVisible();

  await page.getByRole("button", { name: "Rate 8 out of 10" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();

  // The entry survives a full reload, so it was persisted on the server.
  await page.reload();
  await expect(page.getByText("Saved in your library")).toBeVisible();
});
