import { expect, test } from "@playwright/test";

test("home page renders Pulse360", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pulse360" })).toBeVisible();
});
