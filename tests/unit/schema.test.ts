import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  analyticsSnapshots,
  auditLogs,
  concernMentions,
  concerns,
  dailyPulses,
  departments,
  hrNotes,
  monthlyReports,
  notificationPreferences,
  organizations,
  recognitions,
  teams,
  users,
} from "@/db/schema";

const columnNames = (table: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(table)
    .columns.map((c) => c.name)
    .sort();
const primaryKeyColumn = (table: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(table).columns.find((c) => c.primary)?.name;

describe("database schema (§14)", () => {
  it("uses UUID primary keys and timestamps across tables", () => {
    for (const table of [
      organizations,
      departments,
      teams,
      users,
      dailyPulses,
      recognitions,
      concerns,
      concernMentions,
      hrNotes,
      monthlyReports,
      analyticsSnapshots,
      auditLogs,
      notificationPreferences,
    ]) {
      expect(primaryKeyColumn(table)).toBe("id");
    }
  });

  it("scopes org-level tables with organization_id", () => {
    for (const table of [
      departments,
      teams,
      users,
      dailyPulses,
      recognitions,
      concerns,
      monthlyReports,
      analyticsSnapshots,
      auditLogs,
    ]) {
      expect(columnNames(table)).toContain("organization_id");
    }
  });

  it("keeps concern-sensitive relations out of broad user queries", () => {
    // concern_mentions and hr_notes are their own tables, never embedded.
    expect(columnNames(concernMentions)).toContain("mentioned_employee_id");
    expect(columnNames(hrNotes)).toContain("note");
  });

  it("defines the daily pulse columns", () => {
    const names = columnNames(dailyPulses);
    for (const expected of [
      "id",
      "organization_id",
      "employee_id",
      "pulse_date",
      "sentiment_score",
      "mood_tags",
      "best_moment",
      "improvement_text",
    ]) {
      expect(names).toContain(expected);
    }
  });

  it("defines recognition columns with giver, recipient, category", () => {
    const names = columnNames(recognitions);
    for (const expected of [
      "giver_id",
      "recipient_id",
      "recognition_date",
      "category",
      "message",
    ]) {
      expect(names).toContain(expected);
    }
  });

  it("defines concern workflow fields", () => {
    const names = columnNames(concerns);
    for (const expected of [
      "reporter_id",
      "category",
      "description",
      "anonymous",
      "visibility",
      "status",
      "severity",
      "resolved_at",
    ]) {
      expect(names).toContain(expected);
    }
  });

  it("defines notification preferences per user", () => {
    const names = columnNames(notificationPreferences);
    for (const expected of [
      "user_id",
      "daily_pulse_enabled",
      "email_enabled",
      "slack_enabled",
      "teams_enabled",
      "reminder_time",
      "timezone",
    ]) {
      expect(names).toContain(expected);
    }
  });
});