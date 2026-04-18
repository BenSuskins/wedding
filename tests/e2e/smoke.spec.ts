import { expect, test } from "@playwright/test";

test("home page renders the wedding heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Our Wedding" })).toBeVisible();
});
