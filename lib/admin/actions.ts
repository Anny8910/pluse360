"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/db";
import {
  account,
  departments,
  notificationPreferences,
  organizations,
  teams,
  users,
} from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/permissions";
import {
  createUserSchema,
  departmentSchema,
  optionalUuid,
  orgSettingsSchema,
  teamSchema,
  updateUserSchema,
} from "@/lib/validation/admin";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

const friendlyMessage = (err: unknown, label: string): string => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("duplicate key")) {
    return `A ${label} with those values already exists.`;
  }
  return "Something went wrong. Please try again.";
};

const notFound = (label: string): AdminActionResult => ({
  ok: false,
  error: `${label} not found in your organization.`,
});

// ---------------------------------------------------------------------------
// Organization settings
// ---------------------------------------------------------------------------

export async function updateOrgSettings(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const parsed = orgSettingsSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, actor.organizationId))
      .limit(1);
    if (!org) return notFound("Organization");

    await db
      .update(organizations)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(organizations.id, org.id));

    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "organization.updated",
      entityType: "organizations",
      entityId: org.id,
      metadata: parsed.data,
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "organization") };
  }
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export async function createDepartment(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const parsed = departmentSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const id = randomUUID();
  try {
    await db.insert(departments).values({
      id,
      organizationId: actor.organizationId,
      name: parsed.data.name,
    });
    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "department.created",
      entityType: "departments",
      entityId: id,
      metadata: parsed.data,
    });
    revalidatePath("/admin/departments");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "department") };
  }
}

export async function renameDepartment(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const id = optionalUuid(formData.get("id"));
  const parsed = departmentSchema.safeParse({ name: formData.get("name") });
  if (!id || !parsed.success) {
    return { ok: false, error: parsed.error?.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const [row] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.organizationId, actor.organizationId)))
      .limit(1);
    if (!row) return notFound("Department");

    await db
      .update(departments)
      .set({ name: parsed.data.name, updatedAt: new Date() })
      .where(eq(departments.id, row.id));
    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "department.updated",
      entityType: "departments",
      entityId: row.id,
      metadata: parsed.data,
    });
    revalidatePath("/admin/departments");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "department") };
  }
}

export async function deleteDepartment(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const id = optionalUuid(formData.get("id"));
  if (!id) return { ok: false, error: "Invalid department." };

  try {
    const [row] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.organizationId, actor.organizationId)))
      .limit(1);
    if (!row) return notFound("Department");

    await db.delete(departments).where(eq(departments.id, row.id));
    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "department.deleted",
      entityType: "departments",
      entityId: row.id,
    });
    revalidatePath("/admin/departments");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "department") };
  }
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export async function createTeam(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    departmentId: optionalUuid(formData.get("departmentId")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const id = randomUUID();
  try {
    await db.insert(teams).values({
      id,
      organizationId: actor.organizationId,
      departmentId: parsed.data.departmentId,
      name: parsed.data.name,
    });
    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "team.created",
      entityType: "teams",
      entityId: id,
      metadata: parsed.data,
    });
    revalidatePath("/admin/teams");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "team") };
  }
}

export async function renameTeam(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const id = optionalUuid(formData.get("id"));
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    departmentId: optionalUuid(formData.get("departmentId")),
  });
  if (!id || !parsed.success) {
    return { ok: false, error: parsed.error?.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const [row] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.id, id), eq(teams.organizationId, actor.organizationId)))
      .limit(1);
    if (!row) return notFound("Team");

    await db
      .update(teams)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(teams.id, row.id));
    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "team.updated",
      entityType: "teams",
      entityId: row.id,
      metadata: parsed.data,
    });
    revalidatePath("/admin/teams");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "team") };
  }
}

export async function deleteTeam(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const id = optionalUuid(formData.get("id"));
  if (!id) return { ok: false, error: "Invalid team." };

  try {
    const [row] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.id, id), eq(teams.organizationId, actor.organizationId)))
      .limit(1);
    if (!row) return notFound("Team");

    await db.delete(teams).where(eq(teams.id, row.id));
    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "team.deleted",
      entityType: "teams",
      entityId: row.id,
    });
    revalidatePath("/admin/teams");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "team") };
  }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const insertUserError = (err: unknown): string => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("users_organization_email_unique")) {
    return "A user with that email already exists in this organization.";
  }
  if (msg.includes("duplicate key")) {
    return "A user with those values already exists.";
  }
  return "Something went wrong. Please try again.";
};

export async function createUser(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    departmentId: optionalUuid(formData.get("departmentId")),
    teamId: optionalUuid(formData.get("teamId")),
    managerId: optionalUuid(formData.get("managerId")),
    jobTitle: optionalUuid(formData.get("jobTitle")),
    location: optionalUuid(formData.get("location")),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const id = randomUUID();
  try {
    await db.insert(users).values({
      id,
      organizationId: actor.organizationId,
      email: parsed.data.email,
      emailVerified: true,
      name: parsed.data.name,
      role: parsed.data.role,
      departmentId: parsed.data.departmentId,
      teamId: parsed.data.teamId,
      managerId: parsed.data.managerId,
      jobTitle: parsed.data.jobTitle,
      location: parsed.data.location,
      active: true,
    });

    const passwordHash = await hashPassword(parsed.data.password);
    await db.insert(account).values({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: passwordHash,
    });

    await db.insert(notificationPreferences).values({ userId: id });

    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "user.created",
      entityType: "users",
      entityId: id,
      metadata: { email: parsed.data.email, role: parsed.data.role },
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: insertUserError(err) };
  }
}

export async function updateUser(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const id = optionalUuid(formData.get("id"));
  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    departmentId: optionalUuid(formData.get("departmentId")),
    teamId: optionalUuid(formData.get("teamId")),
    managerId: optionalUuid(formData.get("managerId")),
    jobTitle: optionalUuid(formData.get("jobTitle")),
    location: optionalUuid(formData.get("location")),
  });
  if (!id || !parsed.success) {
    return { ok: false, error: parsed.error?.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const [row] = await db
      .select({
        id: users.id,
        role: users.role,
        active: users.active,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(and(eq(users.id, id), eq(users.organizationId, actor.organizationId)))
      .limit(1);
    if (!row) return notFound("User");

    if (!row.active && actor.id === row.id) {
      return { ok: false, error: "You cannot deactivate your own account." };
    }

    await db
      .update(users)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(users.id, row.id));
    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "user.updated",
      entityType: "users",
      entityId: row.id,
      metadata: parsed.data,
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "user") };
  }
}

export async function resetUserPassword(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const id = optionalUuid(formData.get("id"));
  const password = formData.get("password");
  if (!id || typeof password !== "string" || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  try {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), eq(users.organizationId, actor.organizationId)))
      .limit(1);
    if (!row) return notFound("User");

    const passwordHash = await hashPassword(password);
    const [existing] = await db
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, row.id), eq(account.providerId, "credential")))
      .limit(1);

    if (existing) {
      await db
        .update(account)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(account.id, existing.id));
    } else {
      await db.insert(account).values({
        id: randomUUID(),
        accountId: row.id,
        providerId: "credential",
        userId: row.id,
        password: passwordHash,
      });
    }

    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "user.password_reset",
      entityType: "users",
      entityId: row.id,
    });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function setUserActive(
  _prev: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  const actor = await requireRole("admin");
  const id = optionalUuid(formData.get("id"));
  const wantsActive = formData.get("active") === "true";
  if (!id) return { ok: false, error: "Invalid user." };

  try {
    const [row] = await db
      .select({
        id: users.id,
        active: users.active,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(and(eq(users.id, id), eq(users.organizationId, actor.organizationId)))
      .limit(1);
    if (!row) return notFound("User");
    if (!wantsActive && actor.id === row.id) {
      return { ok: false, error: "You cannot deactivate your own account." };
    }

    await db
      .update(users)
      .set({ active: wantsActive, updatedAt: new Date() })
      .where(eq(users.id, row.id));
    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: wantsActive ? "user.activated" : "user.deactivated",
      entityType: "users",
      entityId: row.id,
    });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "user") };
  }
}
