import { describe, expect, it } from "vitest";
import {
  ANALYTICS_SCOPE_VALUES,
  CONCERN_CATEGORIES,
  CONCERN_SEVERITY_VALUES,
  CONCERN_STATUS_VALUES,
  CONCERN_VISIBILITY_VALUES,
  MOOD_TAGS,
  RECOGNITION_CATEGORIES,
  REPORT_STATUS_VALUES,
  ROLE_ENUM_VALUES,
} from "@/db/schema/constants";

describe("master-document option lists (§7, §9, §12, §14)", () => {
  it("defines the four roles", () => {
    expect(ROLE_ENUM_VALUES).toEqual(["employee", "manager", "hr", "admin"]);
  });

  it("defines the exact mood tags", () => {
    expect(MOOD_TAGS).toEqual([
      "Productive",
      "Stressful",
      "Collaborative",
      "Frustrating",
      "Motivating",
      "Routine",
      "Challenging",
      "Fun",
      "Overwhelming",
      "Appreciated",
      "Isolated",
    ]);
  });

  it("defines the ten recognition categories", () => {
    expect(RECOGNITION_CATEGORIES).toEqual([
      "Collaboration",
      "Problem solving",
      "Mentorship",
      "Ownership",
      "Customer focus",
      "Communication",
      "Creativity",
      "Leadership",
      "Execution",
      "Support",
    ]);
  });

  it("defines the eight concern categories", () => {
    expect(CONCERN_CATEGORIES).toEqual([
      "process",
      "collaboration",
      "manager",
      "customer",
      "workload",
      "communication",
      "meetings",
      "other",
    ]);
  });

  it("defines concern visibility, status, and severity", () => {
    expect(CONCERN_VISIBILITY_VALUES).toEqual([
      "hr_only",
      "manager_and_hr",
      "anonymous_to_management",
    ]);
    expect(CONCERN_STATUS_VALUES).toEqual([
      "new",
      "reviewed",
      "investigating",
      "action_taken",
      "resolved",
    ]);
    expect(CONCERN_SEVERITY_VALUES).toEqual(["low", "medium", "high"]);
  });

  it("defines report status and analytics scope", () => {
    expect(REPORT_STATUS_VALUES).toEqual(["draft", "generated", "published"]);
    expect(ANALYTICS_SCOPE_VALUES).toEqual(["company", "department", "team"]);
  });
});