"use server";

import { and, count, eq, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  analyticsSnapshots,
  dailyPulses,
  hrNotes,
  concerns,
  monthlyReports,
  organizations,
  users,
} from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/permissions";
import {
  averageScore,
  meetsThreshold,
  participationRate,
  sentimentBands,
} from "@/lib/analytics/aggregate";
import {
  createConcernSchema,
  hrNoteSchema,
  monthlyReportSchema,
  updateConcernSchema,
} from "@/lib/validation/hr";
import { daysAgoKey, todayKey, utcDateKey } from "@/lib/utils/date";

export type HrActionResult = { ok: true } | { ok: false; error: string };

const friendlyMessage = (err: unknown, label: string): string => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("duplicate key")) {
    return `A ${label} already exists.`;
  }
  return "Something went wrong. Please try again.";
};

// ---------------------------------------------------------------------------
// Concerns
// ---------------------------------------------------------------------------

export async function createConcern(
  _prev: HrActionResult | undefined,
  formData: FormData
): Promise<HrActionResult> {
  const actor = await requireRole("hr");

  const parsed = createConcernSchema.safeParse({
    category: formData.get("category"),
    description: formData.get("description"),
    anonymous: formData.get("anonymous"),
    visibility: formData.get("visibility"),
    severity: formData.get("severity") ?? "low",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const input = parsed.data;
  try {
    const [concern] = await db
      .insert(concerns)
      .values({
        organizationId: actor.organizationId,
        reporterId: input.anonymous ? null : actor.id,
        category: input.category,
        description: input.description,
        anonymous: input.anonymous,
        visibility: input.visibility,
        severity: input.severity,
      })
      .returning({ id: concerns.id });

    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "concern_created",
      entityType: "concern",
      entityId: concern.id,
      metadata: { category: input.category, severity: input.severity },
    });
    revalidatePath("/hr", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateConcern(
  _prev: HrActionResult | undefined,
  formData: FormData
): Promise<HrActionResult> {
  const actor = await requireRole("hr");

  const parsed = updateConcernSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    severity: formData.get("severity"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { id, status, severity } = parsed.data;
  const [updated] = await db
    .update(concerns)
    .set({
      status,
      severity,
      resolvedAt: status === "resolved" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(concerns.id, id), eq(concerns.organizationId, actor.organizationId))
    )
    .returning({ id: concerns.id });

  if (!updated) return { ok: false, error: "Concern not found in your organization." };

  await logAudit({
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "concern_updated",
    entityType: "concern",
    entityId: id,
    metadata: { status, severity },
  });
  revalidatePath("/hr", "layout");
  return { ok: true };
}

export async function addHrNote(
  _prev: HrActionResult | undefined,
  formData: FormData
): Promise<HrActionResult> {
  const actor = await requireRole("hr");

  const parsed = hrNoteSchema.safeParse({
    concernId: formData.get("concernId"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { concernId, note } = parsed.data;
  const [concern] = await db
    .select({ id: concerns.id })
    .from(concerns)
    .where(
      and(eq(concerns.id, concernId), eq(concerns.organizationId, actor.organizationId))
    )
    .limit(1);
  if (!concern) return { ok: false, error: "Concern not found in your organization." };

  await db.insert(hrNotes).values({
    concernId,
    authorId: actor.id,
    note,
  });
  await logAudit({
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "hr_note_added",
    entityType: "concern",
    entityId: concernId,
  });
  revalidatePath("/hr", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Monthly report generation
// ---------------------------------------------------------------------------

async function computeOrgAggregate(orgId: string, timezone: string | null) {
  const weekStart = utcDateKey(daysAgoKey(6, timezone));
  const today = utcDateKey(todayKey(timezone));

  const [activeCount, todaySubmitted, weekPulses, openConcerns, recognitionCount] =
    await Promise.all([
      db
        .select({ total: count() })
        .from(users)
        .where(and(eq(users.organizationId, orgId), eq(users.active, true))),
      db
        .select({ total: count() })
        .from(dailyPulses)
        .where(
          and(eq(dailyPulses.organizationId, orgId), eq(dailyPulses.pulseDate, today))
        ),
      db
        .select({ sentimentScore: dailyPulses.sentimentScore })
        .from(dailyPulses)
        .where(
          and(
            eq(dailyPulses.organizationId, orgId),
            gte(dailyPulses.pulseDate, weekStart)
          )
        ),
      db
        .select({ total: count() })
        .from(concerns)
        .where(
          and(
            eq(concerns.organizationId, orgId),
            inArray(concerns.status, ["new", "investigating"])
          )
        ),
      db
        .select({ total: count() })
        .from(dailyPulses)
        .where(eq(dailyPulses.organizationId, orgId)),
    ]);

  const active = activeCount[0]?.total ?? 0;
  return {
    active,
    participationToday: participationRate(todaySubmitted[0]?.total ?? 0, active),
    band: sentimentBands(weekPulses.map((p) => p.sentimentScore)),
    weekAverage: averageScore(weekPulses.map((p) => p.sentimentScore)),
    openConcerns: openConcerns[0]?.total ?? 0,
    pulseCount: recognitionCount[0]?.total ?? 0,
    thresholdMet: meetsThreshold(active),
  };
}

export async function generateMonthlyReport(
  _prev: HrActionResult | undefined,
  formData: FormData
): Promise<HrActionResult> {
  const actor = await requireRole("hr");

  const parsed = monthlyReportSchema.safeParse({
    year: formData.get("year"),
    month: formData.get("month"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { year, month } = parsed.data;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, actor.organizationId))
    .limit(1);
  if (!org) return { ok: false, error: "Organization not found." };

  const aggregate = await computeOrgAggregate(actor.organizationId, org.timezone);

  const monthStart = utcDateKey(`${year}-${String(month).padStart(2, "0")}-01`);
  const monthPulses = await db
    .select({ sentimentScore: dailyPulses.sentimentScore })
    .from(dailyPulses)
    .where(
      and(
        eq(dailyPulses.organizationId, actor.organizationId),
        gte(dailyPulses.pulseDate, monthStart)
      )
    );

  const monthAgg = {
    participationRate: aggregate.participationToday,
    averagePulse: averageScore(monthPulses.map((p) => p.sentimentScore)),
    band: sentimentBands(monthPulses.map((p) => p.sentimentScore)),
  };

  const reportJson = {
    year,
    month,
    generatedAt: new Date().toISOString(),
    activeEmployees: aggregate.active,
    participationToday: aggregate.participationToday,
    weekAverage: aggregate.weekAverage,
    weekBand: aggregate.band,
    monthAverage: monthAgg.averagePulse,
    monthBand: monthAgg.band,
    openConcerns: aggregate.openConcerns,
    totalPulses: aggregate.pulseCount,
  };

  try {
    const existing = await db.query.monthlyReports.findFirst({
      where: and(
        eq(monthlyReports.organizationId, actor.organizationId),
        eq(monthlyReports.year, year),
        eq(monthlyReports.month, month)
      ),
      columns: { id: true },
    });

    if (existing) {
      await db
        .update(monthlyReports)
        .set({
          status: "generated",
          reportJson,
          generatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(monthlyReports.id, existing.id));
    } else {
      await db.insert(monthlyReports).values({
        organizationId: actor.organizationId,
        year,
        month,
        status: "generated",
        reportJson,
        generatedAt: new Date(),
      });
    }

    const num = (v: number | null): string | null => (v === null ? null : String(v));
    const snapshot: typeof analyticsSnapshots.$inferInsert = {
      organizationId: actor.organizationId,
      snapshotDate: utcDateKey(todayKey(org.timezone)),
      scopeType: "company",
      participationRate: num(aggregate.participationToday),
      averagePulse: num(aggregate.weekAverage),
      positiveRate: num(aggregate.band.positive),
      neutralRate: num(aggregate.band.neutral),
      negativeRate: num(aggregate.band.negative),
    };
    await db.insert(analyticsSnapshots).values(snapshot);

    await logAudit({
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "report_generated",
      entityType: "monthly_report",
      entityId: null,
      metadata: { year, month },
    });
    revalidatePath("/hr", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyMessage(err, "report for this month") };
  }
}