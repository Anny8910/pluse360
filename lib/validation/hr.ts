import { z } from "zod";
import {
  CONCERN_CATEGORIES,
  CONCERN_SEVERITY_VALUES,
  CONCERN_STATUS_VALUES,
  CONCERN_VISIBILITY_VALUES,
} from "@/db/schema";

const concernCategorySchema = z.enum(CONCERN_CATEGORIES);
const concernStatusSchema = z.enum(CONCERN_STATUS_VALUES);
const concernSeveritySchema = z.enum(CONCERN_SEVERITY_VALUES);
const concernVisibilitySchema = z.enum(CONCERN_VISIBILITY_VALUES);

export const createConcernSchema = z.object({
  category: concernCategorySchema,
  description: z.string().trim().min(1, "Describe the concern.").max(2000),
  anonymous: z.coerce.boolean(),
  visibility: concernVisibilitySchema,
  severity: concernSeveritySchema.default("low"),
});

export const updateConcernSchema = z.object({
  id: z.string().uuid("Invalid concern."),
  status: concernStatusSchema,
  severity: concernSeveritySchema,
});

export const hrNoteSchema = z.object({
  concernId: z.string().uuid("Invalid concern."),
  note: z.string().trim().min(1, "A note is required.").max(2000),
});

export const monthlyReportSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type CreateConcernInput = z.infer<typeof createConcernSchema>;
export type UpdateConcernInput = z.infer<typeof updateConcernSchema>;
export type HrNoteInput = z.infer<typeof hrNoteSchema>;
export type MonthlyReportInput = z.infer<typeof monthlyReportSchema>;