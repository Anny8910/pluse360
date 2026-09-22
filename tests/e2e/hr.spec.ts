import { expect, test, type Page } from "@playwright/test";

const SEED_PASSWORD = "Pulse360@Dev1";
const HR_EMAIL = "rohan.kapoor@pulse360.dev";
const MANAGER_EMAIL = "arjun.gupta@pulse360.dev";

const runId = Date.now();
const concernDescription = `E2E concern ${runId}`;
const hrNote = `E2E follow-up ${runId}`;

async function login(page: Page, email: string, password = SEED_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe.serial("manager dashboard (§7)", () => {
  test("a manager sees their team dashboard, not HR", async ({ page }) => {
    await login(page, MANAGER_EMAIL);
    await page.waitForURL("/employee");

    await page.goto("/manager");
    await expect(
      page.getByRole("heading", { name: "Team dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Participation today")).toBeVisible();

    await page.goto("/hr");
    await expect(page).toHaveURL(/\/employee$/);
  });
});

test.describe.serial("HR workspace: concerns, employees, reports (§8)", () => {
  test("an HR member logs a concern, updates it, and adds a note", async ({
    page,
  }) => {
    await login(page, HR_EMAIL);
    await page.waitForURL("/hr");
    await expect(page.getByRole("heading", { name: "HR Hub" })).toBeVisible();

    await page.goto("/hr/concerns");
    await page.getByLabel("Description").fill(concernDescription);
    await page.getByRole("button", { name: "Log concern" }).click();
    await expect(page.getByText("Saved.")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(concernDescription)).toBeVisible();

    const row = page
      .locator("div")
      .filter({ has: page.getByText(concernDescription) })
      .last();

    await row.getByLabel("Status").selectOption("investigating");
    await row.getByRole("button", { name: "Update" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    await expect(row.getByLabel("Status")).toHaveValue("investigating");

    await row.getByPlaceholder("Add an internal note…").fill(hrNote);
    await row.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText(hrNote)).toBeVisible();
  });

  test("the HR member views the employee roster", async ({ page }) => {
    await login(page, HR_EMAIL);
    await page.waitForURL("/hr");

    await page.goto("/hr/employees");
    await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("the HR member opens a period-based pulse log for one employee", async ({
    page,
  }) => {
    await login(page, HR_EMAIL);
    await page.waitForURL("/hr");

    await page.goto("/hr/employees");
    const firstRow = page.locator("tbody tr").first();
    const employeeName = (await firstRow.locator("td").first().innerText())
      .split("\n")[0];
    await firstRow
      .getByRole("link", { name: /Pulse log for/ })
      .click();

    await page.waitForURL(/\/hr\/employees\/[a-f0-9-]{36}/, { timeout: 20_000 });
    await expect(
      page.getByRole("heading", { name: employeeName })
    ).toBeVisible();
    await expect(page.getByText("Pulse timeline")).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("columnheader", { name: "Submissions" })
    ).toBeVisible({ timeout: 15_000 });

    await page.goto(page.url() + "?preset=7");
    await expect(page.getByText("Relationship signals")).toBeVisible({ timeout: 15_000 });
  });

  test("the HR member generates a monthly report", async ({ page }) => {
    await login(page, HR_EMAIL);
    await page.waitForURL("/hr");

    await page.goto("/hr/reports");
    await expect(
      page.getByRole("heading", { name: "Monthly reports" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Generate report" }).click();
    await expect(page.getByText("Report generated.")).toBeVisible({
      timeout: 15_000,
    });

    const month = new Date().toLocaleString("en-US", { month: "long" });
    const year = String(new Date().getFullYear());
    await expect(
      page.locator("tbody tr").filter({ hasText: `${month} ${year}` })
    ).toBeVisible();
  });
});