import { z } from "zod";
import { ROLE_ENUM_VALUES } from "@/db/schema";

const nameSchema = z.string().trim().min(1, "Name is required.").max(120);

export const optionalUuid = (value: FormDataEntryValue | null): string | null => {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
};

export const orgSettingsSchema = z.object({
  name: nameSchema.max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens.")
    .max(80),
  timezone: z.string().trim().min(1, "Timezone is required.").max(80),
});

export const departmentSchema = z.object({
  name: nameSchema,
});

export const teamSchema = z.object({
  name: nameSchema,
  departmentId: z.string().uuid("Invalid department.").nullable(),
});

export const roleSchema = z.enum(ROLE_ENUM_VALUES);

export const createUserSchema = z.object({
  name: nameSchema,
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: roleSchema,
  departmentId: z.string().uuid("Invalid department.").nullable(),
  teamId: z.string().uuid("Invalid team.").nullable(),
  managerId: z.string().uuid("Invalid manager.").nullable(),
  jobTitle: z.string().trim().max(120).nullable(),
  location: z.string().trim().max(120).nullable(),
  password: z.string().min(8, "Password must be at least 8 characters.").max(100),
});

export const updateUserSchema = z.object({
  name: nameSchema,
  role: roleSchema,
  departmentId: z.string().uuid("Invalid department.").nullable(),
  teamId: z.string().uuid("Invalid team.").nullable(),
  managerId: z.string().uuid("Invalid manager.").nullable(),
  jobTitle: z.string().trim().max(120).nullable(),
  location: z.string().trim().max(120).nullable(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type OrgSettingsInput = z.infer<typeof orgSettingsSchema>;
