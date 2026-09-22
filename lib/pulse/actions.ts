"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { dailyPulses, organizations } from "@/db/schema";
import { requireAuth } from "@/lib/permissions";
import { pulseSchema, sanitizeMoodTags } from "@/lib/validation/pulse";
import { todayKey, utcDateKey } from "@/lib/utils/date";

export type PulseActionResult = { ok: true } | { ok: false; error: string };

export async function submitPulse(
  _prev: PulseActionResult | undefined,
  formData: FormData
): Promise<PulseActionResult> {
  const user = await requireAuth();

  const org = user.organizationId
    ? await db.query.organizations.findFirst({
        where: eq(organizations.id, user.organizationId),
        columns: { timezone: true },
      })
    : null;

  const parsed = pulseSchema.safeParse({
    sentimentScore: formData.get("sentimentScore"),
    moodTags: sanitizeMoodTags(formData.getAll("moodTags")),
    bestMoment: formData.get("bestMoment"),
    improvementText: formData.get("improvementText"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const pulseDate = utcDateKey(todayKey(org?.timezone));
  const existing = await db.query.dailyPulses.findFirst({
    where: and(
      eq(dailyPulses.employeeId, user.id),
      eq(dailyPulses.pulseDate, pulseDate)
    ),
    columns: { id: true },
  });
  if (existing) {
    return { ok: false, error: "You have already recorded today's pulse." };
  }

  try {
    const input = parsed.data;
    await db.insert(dailyPulses).values({
      organizationId: user.organizationId,
      employeeId: user.id,
      pulseDate,
      sentimentScore: input.sentimentScore,
      moodTags: input.moodTags,
      bestMoment: input.bestMoment?.trim() || null,
      improvementText: input.improvementText?.trim() || null,
    });
    revalidatePath("/employee", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}