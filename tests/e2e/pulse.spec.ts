import { expect, test, type Page } from "@playwright/test";

const SEED_PASSWORD = "Pulse360@Dev1";
const ADMIN_EMAIL = "ananya.sharma@pulse360.dev";

const runId = Date.now();
const employeeEmail = `e2e.${runId}@pulse360.dev`;
const employeeName = "Mia E2e";
const employeePassword = "TempPass123!";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe.serial("daily pulse, history, and profile (§5–§6, §9)", () => {
  test("an admin creates a fresh employee so the pulse flow is deterministic", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL, SEED_PASSWORD);
    await page.waitForURL("/admin");

    await page.goto("/admin/users");
    const createUserForm = page
      .locator("form")
      .filter({ has: page.getByLabel("Initial password") });
    await createUserForm.getByLabel("User name").fill(employeeName);
    await createUserForm.getByLabel("Email").fill(employeeEmail);
    await createUserForm.getByLabel("Initial password").fill(employeePassword);
    await page.getByRole("button", { name: "Create user" }).click();

    const row = page.locator("tr").filter({ hasText: employeeEmail });
    await expect(row).toContainText(employeeName, { timeout: 20_000 });
    await expect(row).toContainText("employee");

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/\/login$/);
  });

  test("the employee records one pulse per day and sees it in history", async ({
    page,
  }) => {
    await login(page, employeeEmail, employeePassword);
    await page.waitForURL("/employee");
    await expect(
      page.getByRole("heading", { name: "Employee Workspace" })
    ).toBeVisible();

    await page.getByRole("link", { name: "Record today's pulse" }).click();
    await expect(page.getByRole("heading", { name: "Daily pulse" })).toBeVisible();

    await page.getByText("Great", { exact: true }).click();
    await page.getByText("Collaborative", { exact: true }).click();
    await page.getByLabel("Best moment").fill("Shipped the release");
    await page.getByRole("button", { name: "Record pulse" }).click();

    await expect(
      page.getByText("Pulse recorded", { exact: true })
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("5/5")).toBeVisible();
    await expect(page.getByText("Collaborative")).toBeVisible();

    await page.goto("/employee/pulse");
    await expect(
      page.getByText("Pulse recorded", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("How was your day?")).toHaveCount(0);

    await page.goto("/employee/history");
    await expect(page.getByRole("heading", { name: "Pulse history" })).toBeVisible();
    const row = page.locator("tbody tr").first();
    await expect(row).toContainText("5/5", { timeout: 20_000 });
    await expect(row).toContainText("Shipped the release");
  });

  test("the employee saves notification preferences from their profile", async ({
    page,
  }) => {
    await login(page, employeeEmail, employeePassword);
    await page.waitForURL("/employee");

    await page.goto("/employee/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText(employeeName)).toBeVisible();

    await page.getByLabel("Email", { exact: true }).check();
    await page.getByLabel("Reminder time (24h)").fill("17:30");
    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page.getByText("Preferences saved.")).toBeVisible();
  });
});