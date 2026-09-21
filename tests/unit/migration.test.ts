import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const drizzleDir = join(process.cwd(), "drizzle");
const migrations = readdirSync(drizzleDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(join(drizzleDir, f), "utf8"))
  .join("\n");

describe("database constraints (§14–15)", () => {
  it("has at least one committed migration", () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  it("enforces one daily pulse per employee per day", () => {
    expect(migrations).toContain('UNIQUE("employee_id","pulse_date")');
  });

  it("enforces no self-recognition", () => {
    expect(migrations).toContain("giver_id");
    expect(migrations).toContain("recipient_id");
    expect(migrations).toContain('"recognitions"."giver_id" <> "recognitions"."recipient_id"');
  });

  it("enforces sentiment score range 1..5", () => {
    expect(migrations).toContain("between 1 and 5");
  });

  it("enforces unique organization_email per user", () => {
    expect(migrations).toContain('UNIQUE("organization_id","email")');
  });

  it("isolates organizations via foreign keys on org-scoped tables", () => {
    const orgScopedFks = [
      "departments_organization_id_organizations_id_fk",
      "teams_organization_id_organizations_id_fk",
      "users_organization_id_organizations_id_fk",
      "daily_pulses_organization_id_organizations_id_fk",
      "recognitions_organization_id_organizations_id_fk",
      "concerns_organization_id_organizations_id_fk",
      "monthly_reports_organization_id_organizations_id_fk",
      "analytics_snapshots_organization_id_organizations_id_fk",
      "audit_logs_organization_id_organizations_id_fk",
    ];
    for (const fk of orgScopedFks) {
      expect(migrations).toContain(fk);
    }
  });

  it("creates the required analysis indexes (§15)", () => {
    const indexes = [
      "daily_pulses_employee_date_idx",
      "daily_pulses_org_date_idx",
      "recognitions_recipient_date_idx",
      "recognitions_giver_date_idx",
      "recognitions_org_date_idx",
      "concerns_org_created_idx",
      "concerns_status_created_idx",
      "users_organization_department_idx",
      "users_organization_team_idx",
      "analytics_snapshots_org_date_idx",
    ];
    for (const idx of indexes) {
      expect(migrations).toContain(idx);
    }
  });
});
