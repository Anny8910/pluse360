"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { requireAuth } from "@/lib/permissions";
import { notificationPreferencesSchema } from "@/lib/validation/notifications";

export type PreferencesActionResult = { ok: true } | { ok: false; error: string };

export async function updateNotificationPreferences(
  _prev: PreferencesActionResult | undefined,
  formData: FormData
): Promise<PreferencesActionResult> {
  const user = await requireAuth();

  const parsed = notificationPreferencesSchema.safeParse({
    dailyPulseEnabled: formData.get("dailyPulseEnabled"),
    emailEnabled: formData.get("emailEnabled"),
    slackEnabled: formData.get("slackEnabled"),
    teamsEnabled: formData.get("teamsEnabled"),
    reminderTime: formData.get("reminderTime"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const input = parsed.data;
  const reminderTime = input.reminderTime || null;

  try {
    const existing = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, user.id),
      columns: { id: true },
    });

    if (existing) {
      await db
        .update(notificationPreferences)
        .set({
          dailyPulseEnabled: input.dailyPulseEnabled,
          emailEnabled: input.emailEnabled,
          slackEnabled: input.slackEnabled,
          teamsEnabled: input.teamsEnabled,
          reminderTime,
          timezone: input.timezone || null,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, user.id));
    } else {
      await db.insert(notificationPreferences).values({
        userId: user.id,
        dailyPulseEnabled: input.dailyPulseEnabled,
        emailEnabled: input.emailEnabled,
        slackEnabled: input.slackEnabled,
        teamsEnabled: input.teamsEnabled,
        reminderTime,
        timezone: input.timezone || null,
      });
    }
    revalidatePath("/employee", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}