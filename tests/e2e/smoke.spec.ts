import { expect, test } from "@playwright/test";

test("unauthenticated visitors are redirected to the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome to Pulse360" })).toBeVisible();
});
