import { and, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { dailyPulses, organizations, recognitions, users } from "@/db/schema";
import { dayKey, daysAgoKey, todayKey, utcDateKey } from "@/lib/utils/date";

export const PULSE_PRESETS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function clampDateKey(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toISOString().slice(0, 10);
}

export interface PulsePeriod {
  start: string;
  end: string;
  presetDays: number;
}

export function resolvePulsePeriod(
  params: Record<string, string | string[] | undefined>,
  timezone?: string | null
): PulsePeriod {
  const getParam = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : undefined;
  };
  const fromRaw = getParam("from");
  const toRaw = getParam("to");
  const presetRaw = getParam("preset");
  const presetDays = PULSE_PRESETS.find((p) => String(p.days) === presetRaw)?.days ?? 30;

  let start: string;
  let end: string;
  const fromValid = fromRaw && DATE_RE.test(fromRaw) ? clampDateKey(fromRaw) : null;
  const toValid = toRaw && DATE_RE.test(toRaw) ? clampDateKey(toRaw) : null;
  if (fromValid && toValid && fromValid <= toValid) {
    start = fromValid;
    end = toValid;
  } else if (fromValid && !toValid) {
    start = fromValid;
    end = todayKey(timezone);
  } else {
    end = todayKey(timezone);
    start = daysAgoKey(presetDays, timezone);
  }
  const cappedStartMs = utcDateKey(start).getTime();
  const cappedEndMs = utcDateKey(end).getTime();
  if (cappedEndMs - cappedStartMs > 366 * 86_400_000) {
    start = dayKey(new Date(cappedEndMs - 365 * 86_400_000));
  }
  return { start, end, presetDays };
}

export function isoWeekMonday(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export interface EmployeeTeammate {
  id: string;
  name: string;
}

export interface EmployeeConnection {
  peerId: string;
  name: string;
  given: number;
  received: number;
}

export type EmployeePulse = typeof dailyPulses.$inferSelect;

export interface EmployeeInsights {
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
    jobTitle: string | null;
    department: { name: string } | null;
    team: { name: string } | null;
    manager: { name: string } | null;
  };
  timezone: string | null;
  pulses: EmployeePulse[];
  connections: EmployeeConnection[];
  limitedTeammates: EmployeeTeammate[];
  weekRows: Array<{ startKey: string; pulses: EmployeePulse[] }>;
  count: number;
  avg: number | null;
  high: number;
  low: number;
  topTags: Array<[string, number]>;
}

export async function loadEmployeeInsights(opts: {
  organizationId: string;
  employeeId: string;
  start: string;
  end: string;
}): Promise<EmployeeInsights | null> {
  const { organizationId, employeeId, start, end } = opts;
  const range = { startUtc: utcDateKey(start), endUtc: utcDateKey(end) };

  const employee = await db.query.users.findFirst({
    where: and(eq(users.id, employeeId), eq(users.organizationId, organizationId)),
    with: { department: true, team: true, manager: true },
  });
  if (!employee) return null;

  const [org] = await db
    .select({ timezone: organizations.timezone })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  const [pulses, givenRows, receivedRows] = await Promise.all([
    db.query.dailyPulses.findMany({
      where: and(
        eq(dailyPulses.organizationId, organizationId),
        eq(dailyPulses.employeeId, employee.id),
        gte(dailyPulses.pulseDate, range.startUtc),
        lte(dailyPulses.pulseDate, range.endUtc)
      ),
      orderBy: (p, { asc }) => [asc(p.pulseDate)],
    }),
    db.query.recognitions.findMany({
      where: and(
        eq(recognitions.organizationId, organizationId),
        eq(recognitions.giverId, employee.id),
        gte(recognitions.recognitionDate, range.startUtc),
        lte(recognitions.recognitionDate, range.endUtc)
      ),
    }),
    db.query.recognitions.findMany({
      where: and(
        eq(recognitions.organizationId, organizationId),
        eq(recognitions.recipientId, employee.id),
        gte(recognitions.recognitionDate, range.startUtc),
        lte(recognitions.recognitionDate, range.endUtc)
      ),
    }),
  ]);

  const peerIds = [
    ...new Set([
      ...givenRows.map((r) => r.recipientId),
      ...receivedRows.map((r) => r.giverId),
    ]),
  ];
  const peers =
    peerIds.length > 0
      ? await db.query.users.findMany({
          where: and(
            eq(users.organizationId, organizationId),
            inArray(users.id, peerIds)
          ),
          columns: { id: true, name: true },
        })
      : [];
  const peerName = new Map(peers.map((p) => [p.id, p.name]));

  const teammates =
    employee.teamId
      ? await db.query.users.findMany({
          where: and(
            eq(users.organizationId, organizationId),
            eq(users.teamId, employee.teamId),
            eq(users.active, true),
            ne(users.id, employee.id)
          ),
          orderBy: (u, { asc }) => [asc(u.name)],
          columns: { id: true, name: true },
        })
      : [];

  const conn = new Map<string, { given: number; received: number }>();
  for (const r of givenRows) {
    const c = conn.get(r.recipientId) ?? { given: 0, received: 0 };
    c.given += 1;
    conn.set(r.recipientId, c);
  }
  for (const r of receivedRows) {
    const c = conn.get(r.giverId) ?? { given: 0, received: 0 };
    c.received += 1;
    conn.set(r.giverId, c);
  }
  const connections = [...conn.entries()]
    .map(([peerId, c]) => ({ peerId, name: peerName.get(peerId) ?? "Unknown", ...c }))
    .sort((a, b) => b.given + b.received - (a.given + a.received));
  const limitedTeammates = teammates.filter((t) => !conn.has(t.id));

  const count = pulses.length;
  const avg = count ? pulses.reduce((s, p) => s + p.sentimentScore, 0) / count : null;
  const high = pulses.filter((p) => p.sentimentScore >= 4).length;
  const low = pulses.filter((p) => p.sentimentScore <= 2).length;
  const tagTotals = new Map<string, number>();
  for (const p of pulses) {
    for (const t of p.moodTags) tagTotals.set(t, (tagTotals.get(t) ?? 0) + 1);
  }
  const topTags = [...tagTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const weeks = new Map<string, EmployeePulse[]>();
  for (const p of pulses) {
    const wk = isoWeekMonday(dayKey(p.pulseDate));
    weeks.set(wk, [...(weeks.get(wk) ?? []), p]);
  }
  const weekRows = [...weeks.entries()]
    .map(([startKey, wk]) => ({ startKey, pulses: wk }))
    .sort((a, b) => a.startKey.localeCompare(b.startKey))
    .reverse();

  return {
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      jobTitle: employee.jobTitle,
      department: employee.department ? { name: employee.department.name } : null,
      team: employee.team ? { name: employee.team.name } : null,
      manager: employee.manager ? { name: employee.manager.name } : null,
    },
    timezone: org?.timezone ?? null,
    pulses,
    connections,
    limitedTeammates,
    weekRows,
    count,
    avg,
    high,
    low,
    topTags,
  };
}