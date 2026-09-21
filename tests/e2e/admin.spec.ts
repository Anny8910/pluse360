import { expect, test, type Page } from "@playwright/test";

const SEED_PASSWORD = "Pulse360@Dev1";
const ADMIN_EMAIL = "ananya.sharma@pulse360.dev";
const MANAGER_EMAIL = "arjun.gupta@pulse360.dev";

const runId = Date.now();
const deptName = `Growth Ops ${runId}`;
const teamName = `Community ${runId}`;
const newUserEmail = `newhire.${runId}@pulse360.dev`;
const newUserPassword = "TempPass123!";

async function adminLogin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/admin");
}

test.describe.serial("admin console (§4)", () => {
  test("a manager is blocked from the admin console", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(MANAGER_EMAIL);
    await page.getByLabel("Password").fill(SEED_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/employee");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/employee$/);
  });

  test("an admin creates a department, team, and user, then edits the role", async ({ page }) => {
    await adminLogin(page);

    await page.goto("/admin/departments");
    await page.getByLabel("Department name").fill(deptName);
    await page.getByRole("button", { name: "Add department" }).click();
    const deptRow = page.locator("tbody tr").filter({ hasText: deptName });
    await expect(deptRow).toBeVisible();

    await page.goto("/admin/teams");
    await page.getByLabel("Team name", { exact: true }).fill(teamName);
    await page.getByLabel("Department", { exact: true }).selectOption({ label: deptName });
    await page.getByRole("button", { name: "Add team" }).click();
    const teamRow = page.locator("tbody tr").filter({ hasText: teamName });
    await expect(teamRow).toBeVisible();

    await page.goto("/admin/users");
    const createUserForm = page
      .locator("form")
      .filter({ has: page.getByLabel("Initial password") });
    await createUserForm.getByLabel("User name").fill("Taylor Newhire");
    await createUserForm.getByLabel("Email").fill(newUserEmail);
    await createUserForm.getByLabel("Initial password").fill(newUserPassword);
    await page.getByRole("button", { name: "Create user" }).click();

    const row = page.locator("tr").filter({ hasText: newUserEmail });
    await expect(row).toContainText("Taylor Newhire");
    await expect(row).toContainText("employee");

    await row.getByLabel(/Role/).selectOption({ label: "manager" });
    await row.getByRole("button", { name: "Save" }).click();
    await expect(row).toContainText("manager");
  });

  test("the created user can sign in but cannot reach admin", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(newUserEmail);
    await page.getByLabel("Password").fill(newUserPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/employee");
    await expect(page.getByRole("heading", { name: "Employee Workspace" })).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/employee$/);
  });

  test("deactivating a user locks them out", async ({ page }) => {
    await adminLogin(page);

    await page.goto("/admin/users");
    const row = page.locator("tr").filter({ hasText: newUserEmail });
    await row.getByRole("button", { name: "Deactivate" }).click();
    await expect(row).toContainText("Inactive");

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/\/login$/);

    await page.getByLabel("Email").fill(newUserEmail);
    await page.getByLabel("Password").fill(newUserPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/login$/);
  });
});
