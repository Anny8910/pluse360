import { expect, test, type Page } from "@playwright/test";

const SEED_PASSWORD = "Pulse360@Dev1";

const ADMIN_EMAIL = "ananya.sharma@pulse360.dev";
const HR_EMAIL = "rohan.kapoor@pulse360.dev";
const EMPLOYEE_EMAIL = "kabir.patel@pulse360.dev";
const MANAGER_EMAIL = "arjun.gupta@pulse360.dev";

async function login(page: Page, email: string, password = SEED_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function expectSignedInAt(page: Page, url: string, heading: string) {
  await page.waitForURL(url);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

test.describe("authentication and role-based access (§28)", () => {
  test("anonymous visitors are redirected to the login page", async ({ page }) => {
    await page.goto("/employee");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome to Pulse360" })).toBeVisible();
  });

  test("sign-in rejects an invalid password", async ({ page }) => {
    await login(page, EMPLOYEE_EMAIL, "WrongPassword1");
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("an employee signs in and is blocked from HR and admin", async ({ page }) => {
    await login(page, EMPLOYEE_EMAIL);
    await expectSignedInAt(page, "/employee", "Employee Workspace");

    await page.goto("/hr");
    await expect(page).toHaveURL(/\/employee$/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/employee$/);
  });

  test("a manager signs in and is blocked from HR and admin", async ({ page }) => {
    await login(page, MANAGER_EMAIL);
    await expectSignedInAt(page, "/employee", "Employee Workspace");

    await page.goto("/hr");
    await expect(page).toHaveURL(/\/employee$/);
  });

  test("an HR member reaches HR but not admin", async ({ page }) => {
    await login(page, HR_EMAIL);
    await expectSignedInAt(page, "/hr", "HR Hub");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/hr$/);
  });

  test("an admin reaches HR and admin", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await expectSignedInAt(page, "/admin", "Ananya Sharma");

    await page.goto("/hr");
    await expectSignedInAt(page, "/hr", "HR Hub");
  });

  test("signing out returns to the login page", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await expectSignedInAt(page, "/admin", "Ananya Sharma");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome to Pulse360" })).toBeVisible();
  });
});
