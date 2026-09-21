import { describe, expect, it } from "vitest";
import {
  ROLE_ORDER,
  ROLE_RANK,
  canAccessAdminModule,
  canAccessHrModule,
  canViewAnalytics,
  canViewEmployeeData,
  hasRole,
  isSameOrganization,
  roleHome,
  roleRank,
  type UserLike,
} from "@/lib/permissions/rules";

const user = (over: Partial<UserLike>): UserLike => ({
  id: "u1",
  organizationId: "org-a",
  role: "employee",
  ...over,
});

describe("RBAC rules (§28)", () => {
  it("orders roles employee < manager < hr < admin", () => {
    expect(ROLE_ORDER).toEqual(["employee", "manager", "hr", "admin"]);
    expect(roleRank("employee")).toBeLessThan(roleRank("manager"));
    expect(roleRank("manager")).toBeLessThan(roleRank("hr"));
    expect(roleRank("hr")).toBeLessThan(roleRank("admin"));
    expect(ROLE_RANK.employee).toBe(10);
    expect(ROLE_RANK.admin).toBe(40);
  });

  it("treats unknown roles as non-privileged", () => {
    expect(roleRank("superuser")).toBe(0);
    expect(hasRole(user({ role: "superuser" }), "employee")).toBe(false);
  });

  it("grants a role to users at or above the minimum", () => {
    expect(hasRole(user({ role: "admin" }), "admin")).toBe(true);
    expect(hasRole(user({ role: "hr" }), "hr")).toBe(true);
    expect(hasRole(user({ role: "hr" }), "admin")).toBe(false);
    expect(hasRole(user({ role: "manager" }), "hr")).toBe(false);
    expect(hasRole(user({ role: "employee" }), "employee")).toBe(true);
  });

  it("limits HR and admin modules by role", () => {
    for (const role of ["employee", "manager"] as const) {
      expect(canAccessHrModule(user({ role }))).toBe(false);
      expect(canAccessAdminModule(user({ role }))).toBe(false);
    }
    expect(canAccessHrModule(user({ role: "hr" }))).toBe(true);
    expect(canAccessAdminModule(user({ role: "hr" }))).toBe(false);
    expect(canAccessHrModule(user({ role: "admin" }))).toBe(true);
    expect(canAccessAdminModule(user({ role: "admin" }))).toBe(true);
  });

  it("gates employee data and analytics to managers and above", () => {
    expect(canViewEmployeeData(user({ role: "employee" }))).toBe(false);
    expect(canViewAnalytics(user({ role: "employee" }))).toBe(false);
    for (const role of ["manager", "hr", "admin"] as const) {
      expect(canViewEmployeeData(user({ role }))).toBe(true);
      expect(canViewAnalytics(user({ role }))).toBe(true);
    }
  });

  it("blocks cross-organization access", () => {
    const a = user({ organizationId: "org-a" });
    const bSame = user({ id: "u2", organizationId: "org-a" });
    const bOther = user({ id: "u2", organizationId: "org-b" });
    expect(isSameOrganization(a, bSame)).toBe(true);
    expect(isSameOrganization(a, bOther)).toBe(false);
    expect(isSameOrganization(a, user({ organizationId: null }))).toBe(false);
  });

  it("maps roles to their home route", () => {
    expect(roleHome("admin")).toBe("/admin");
    expect(roleHome("hr")).toBe("/hr");
    expect(roleHome("manager")).toBe("/employee");
    expect(roleHome("employee")).toBe("/employee");
  });
});
