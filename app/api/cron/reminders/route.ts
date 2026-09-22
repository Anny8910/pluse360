import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { gte } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, dailyPulses } from "@/db/schema";
import { dueChannels, pickDueCandidates, type ReminderCandidate } from "@/lib/notifications/reminders";
import { dayKey, daysAgoKey, nowInTimezone, utcDateKey } from "@/lib/utils/date";

function wallClockInTimezone(timezone?: string | null): Date {
  const [hourStr, minuteStr] = new Date()
    .toLocaleTimeString("en-GB", {
      timeZone: timezone ?? undefined,
      hour: "2-digit",
      minute: "2-digit",
    })
    .split(":");
  return new Date(2000, 0, 1, Number(hourStr), Number(minuteStr));
}

function pulseKeyFor(candidate: ReminderCandidate): string {
  const inTz = nowInTimezone(candidate.timezone);
  return `${candidate.id}|${dayKey(inTz)}`;
}

async function runReminderEngine() {
  const prefs = await db.query.notificationPreferences.findMany({
    with: { user: true },
  });

  const candidates: Array<ReminderCandidate & { organizationId: string }> = prefs
    .filter((p) => p.user && p.user.active)
    .map((p) => ({
      id: p.user.id,
      organizationId: p.user.organizationId,
      timezone: p.timezone,
      channels: {
        email: p.emailEnabled,
        slack: p.slackEnabled,
        teams: p.teamsEnabled,
      },
      enabled: p.dailyPulseEnabled,
      reminderTime: p.reminderTime,
    }));

  const recentPulses = await db
    .select({
      employeeId: dailyPulses.employeeId,
      pulseDate: dailyPulses.pulseDate,
    })
    .from(dailyPulses)
    .where(gte(dailyPulses.pulseDate, utcDateKey(daysAgoKey(2))));

  const pulseKeys = new Set<string>();
  for (const p of recentPulses) {
    pulseKeys.add(`${p.employeeId}|${p.pulseDate.toISOString().slice(0, 10)}`);
  }

  const due = pickDueCandidates(candidates, {
    wallClock: (timezone) => wallClockInTimezone(timezone),
    pulseKeyFor,
    hasPulseKey: (key) => pulseKeys.has(key),
  }) as Array<ReminderCandidate & { organizationId: string }>;

  for (const candidate of due) {
    await db.insert(auditLogs).values({
      organizationId: candidate.organizationId,
      actorId: candidate.id,
      action: "reminder_delivered",
      entityType: "notification",
      metadata: { channels: dueChannels(candidate) },
    });
  }

  return due.length;
}

export async function GET(): Promise<Response> {
  if (process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Use POST with x-cron-secret when CRON_SECRET is set." },
      { status: 405 }
    );
  }
  const delivered = await runReminderEngine();
  return NextResponse.json({ delivered });
}

export async function POST(): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const requestHeaders = await headers();
    if (requestHeaders.get("x-cron-secret") !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const delivered = await runReminderEngine();
  return NextResponse.json({ delivered });
}