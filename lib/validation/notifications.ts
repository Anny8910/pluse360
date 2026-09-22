import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  dailyPulseEnabled: z.coerce.boolean(),
  emailEnabled: z.coerce.boolean(),
  slackEnabled: z.coerce.boolean(),
  teamsEnabled: z.coerce.boolean(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24h time like 17:30.")
    .nullable()
    .or(z.literal("")),
  timezone: z.string().trim().max(80).nullable(),
});

export function reminderTimeParts(
  value: string | null | undefined
): { hour: number; minute: number } | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;