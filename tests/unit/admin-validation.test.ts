import { describe, expect, it } from "vitest";
import {
  createUserSchema,
  departmentSchema,
  orgSettingsSchema,
  roleSchema,
  teamSchema,
  updateUserSchema,
} from "@/lib/validation/admin";

describe("admin validation schemas", () => {
  it("accepts valid departments and rejects empty names", () => {
    expect(departmentSchema.safeParse({ name: "Engineering" }).success).toBe(true);
    expect(departmentSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("accepts valid teams and rejects malformed department ids", () => {
    expect(teamSchema.safeParse({ name: "Frontend", departmentId: null }).success).toBe(true);
    expect(teamSchema.safeParse({ name: "Frontend", departmentId: "not-a-uuid" }).success).toBe(
      false
    );
    expect(teamSchema.safeParse({ name: "", departmentId: null }).success).toBe(false);
  });

  it("enforces slug format for organizations", () => {
    expect(
      orgSettingsSchema.safeParse({ name: "Acme", slug: "acme", timezone: "Asia/Kolkata" }).success
    ).toBe(true);
    expect(
      orgSettingsSchema.safeParse({ name: "Acme", slug: "Acme!x", timezone: "Asia/Kolkata" })
        .success
    ).toBe(false);
    expect(
      orgSettingsSchema.safeParse({ name: "Acme", slug: "acme--x", timezone: "Asia/Kolkata" })
        .success
    ).toBe(false);
  });

  it("only accepts known roles", () => {
    expect(roleSchema.safeParse("admin").success).toBe(true);
    expect(roleSchema.safeParse("employee").success).toBe(true);
    expect(roleSchema.safeParse("superuser").success).toBe(false);
  });

  it("validates new users with email, role and initial password", () => {
    const base = {
      name: "Ada",
      email: "ada@example.com",
      role: "employee",
      departmentId: null,
      teamId: null,
      managerId: null,
      jobTitle: null,
      location: null,
    };
    expect(createUserSchema.safeParse({ ...base, password: "LongEnough1" }).success).toBe(true);
    expect(createUserSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(
      createUserSchema.safeParse({ ...base, email: "not-an-email", password: "LongEnough1" })
        .success
    ).toBe(false);
    expect(
      createUserSchema.safeParse({ ...base, role: "boss", password: "LongEnough1" }).success
    ).toBe(false);
  });

  it("normalizes emails to lowercase on user input", () => {
    const parsed = createUserSchema.safeParse({
      name: "Ada",
      email: "  ADA@Example.COM ",
      role: "employee",
      departmentId: null,
      teamId: null,
      managerId: null,
      jobTitle: null,
      location: null,
      password: "LongEnough1",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("ada@example.com");
  });

  it("rejects updates with invalid ids", () => {
    const doc = {
      name: "Ada",
      role: "manager",
      departmentId: "nope",
      teamId: null,
      managerId: null,
      jobTitle: null,
      location: null,
    };
    expect(updateUserSchema.safeParse(doc).success).toBe(false);
    expect(updateUserSchema.safeParse({ ...doc, departmentId: null }).success).toBe(true);
  });
});
