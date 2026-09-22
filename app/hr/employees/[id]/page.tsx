import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HrNav } from "@/components/hr/nav";
import { HeaderActions } from "@/components/auth/header-actions";
import { db } from "@/db";
import { dailyPulses, organizations, recognitions, users } from "@/db/schema";
import { requireRole } from "@/lib/permissions";
import { SENTIMENT_LABELS } from "@/lib/validation/pulse";
import { daysAgoKey, dayKey, todayKey, utcDateKey } from "@/lib/utils/date";

const PRESETS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatKey(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(d);
}

function formatKeyLong(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function isoWeekMonday(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

function scoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 4) return "default";
  if (score <= 2) return "destructive";
  return "secondary";
}

function clampDateKey(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toISOString().slice(0, 10);
}

export default async function HrEmployeePulsePage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const sp = await props.searchParams;

  const user = await requireRole("hr");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  const employee = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.organizationId, user.organizationId)),
    with: { department: true, team: true, manager: true },
  });
  if (!employee) notFound();

  const getParam = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };
  const fromRaw = getParam("from");
  const toRaw = getParam("to");
  const presetRaw = getParam("preset");
  const presetDays = PRESETS.find((p) => String(p.days) === presetRaw)?.days ?? 30;

  let start: string;
  let end: string;
  const fromValid = fromRaw && DATE_RE.test(fromRaw) ? clampDateKey(fromRaw) : null;
  const toValid = toRaw && DATE_RE.test(toRaw) ? clampDateKey(toRaw) : null;
  if (fromValid && toValid && fromValid <= toValid) {
    start = fromValid;
    end = toValid;
  } else if (fromValid && !toValid) {
    start = fromValid;
    end = todayKey(org?.timezone);
  } else {
    end = todayKey(org?.timezone);
    start = daysAgoKey(presetDays, org?.timezone);
  }
  const cappedStartMs = utcDateKey(start).getTime();
  const cappedEndMs = utcDateKey(end).getTime();
  if (cappedEndMs - cappedStartMs > 366 * 86_400_000) {
    start = dayKey(new Date(cappedEndMs - 365 * 86_400_000));
  }

  const range = { startUtc: utcDateKey(start), endUtc: utcDateKey(end) };

  const [pulses, givenRows, receivedRows] = await Promise.all([
    db.query.dailyPulses.findMany({
      where: and(
        eq(dailyPulses.organizationId, user.organizationId),
        eq(dailyPulses.employeeId, employee.id),
        gte(dailyPulses.pulseDate, range.startUtc),
        lte(dailyPulses.pulseDate, range.endUtc)
      ),
      orderBy: (p, { asc }) => [asc(p.pulseDate)],
    }),
    db.query.recognitions.findMany({
      where: and(
        eq(recognitions.organizationId, user.organizationId),
        eq(recognitions.giverId, employee.id),
        gte(recognitions.recognitionDate, range.startUtc),
        lte(recognitions.recognitionDate, range.endUtc)
      ),
    }),
    db.query.recognitions.findMany({
      where: and(
        eq(recognitions.organizationId, user.organizationId),
        eq(recognitions.recipientId, employee.id),
        gte(recognitions.recognitionDate, range.startUtc),
        lte(recognitions.recognitionDate, range.endUtc)
      ),
    }),
  ]);

  const peerIds = [...new Set([
    ...givenRows.map((r) => r.recipientId),
    ...receivedRows.map((r) => r.giverId),
  ])];
  const peers =
    peerIds.length > 0
      ? await db.query.users.findMany({
          where: and(eq(users.organizationId, user.organizationId), inArray(users.id, peerIds)),
          columns: { id: true, name: true },
        })
      : [];
  const peerName = new Map(peers.map((p) => [p.id, p.name]));

  const teammates =
    employee.teamId
      ? await db.query.users.findMany({
          where: and(
            eq(users.organizationId, user.organizationId),
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

  const weeks = new Map<string, typeof pulses>();
  for (const p of pulses) {
    const wk = isoWeekMonday(dayKey(p.pulseDate));
    weeks.set(wk, [...(weeks.get(wk) ?? []), p]);
  }
  const weekRows = [...weeks.entries()].sort((a, b) => a[0].localeCompare(b[0])).reverse();

  const last30Pending =
    presetDays === 30 && !fromValid && !toValid
      ? [...Array(30).keys()].filter(
          (i) =>
            !pulses.some(
              (p) => dayKey(p.pulseDate) === daysAgoKey(i, org?.timezone)
            )
        ).length
      : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/hr/employees"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label="Back to employees"
            title="Back to employees"
          >
            <ArrowLeft aria-hidden="true" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
            <p className="text-muted-foreground text-sm">{employee.email}</p>
          </div>
        </div>
        <HeaderActions />
      </header>

      <HrNav />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{employee.role}</Badge>
        {employee.jobTitle ? <Badge variant="outline">{employee.jobTitle}</Badge> : null}
        <span className="text-muted-foreground text-sm">
          {employee.department?.name ?? "No department"} /{" "}
          {employee.team?.name ?? "No team"} · Manager: {employee.manager?.name ?? "—"}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pulse timeline</CardTitle>
          <CardDescription>
            Showing {count} pulse{count === 1 ? "" : "s"} from{" "}
            {formatKey(start)} to {formatKey(end)}. Choose a period below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-1.5">
              {PRESETS.map((p) => {
                const active = !fromValid && !toValid && presetDays === p.days;
                return (
                  <Link
                    key={p.days}
                    href={`/hr/employees/${employee.id}?preset=${p.days}`}
                    className={buttonVariants({
                      variant: active ? "default" : "outline",
                      size: "sm",
                    })}
                    aria-current={active ? "page" : undefined}
                  >
                    {p.label}
                  </Link>
                );
              })}
            </div>
            <form
              method="get"
              action={`/hr/employees/${employee.id}`}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pulse-from" className="text-muted-foreground text-xs font-medium">
                  From
                </label>
                <input
                  id="pulse-from"
                  name="from"
                  type="date"
                  defaultValue={start}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-3"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pulse-to" className="text-muted-foreground text-xs font-medium">
                  To
                </label>
                <input
                  id="pulse-to"
                  name="to"
                  type="date"
                  defaultValue={end}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-3"
                />
              </div>
              <button
                type="submit"
                className="border-border bg-background hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-3 text-sm font-medium outline-none hover:text-foreground focus-visible:ring-3"
              >
                Apply
              </button>
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">Submissions</span>
                <span className="text-xl font-semibold">{count}</span>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">Average mood</span>
                <span className="text-xl font-semibold">
                  {avg === null ? "—" : avg.toFixed(1)}
                </span>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">High days (4–5)</span>
                <span className="text-xl font-semibold">{high}</span>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">Low days (1–2)</span>
                <span className="text-xl font-semibold">{low}</span>
              </CardContent>
            </Card>
          </div>

          {weekRows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Avg mood</TableHead>
                  <TableHead>Consistency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekRows.map(([wk, items]) => {
                  const wkAvg = items.reduce((s, p) => s + p.sentimentScore, 0) / items.length;
                  const weekDays = 5;
                  const full = items.length >= weekDays;
                  return (
                    <TableRow key={wk}>
                      <TableCell className="font-medium">Week of {formatKeyLong(wk)}</TableCell>
                      <TableCell>{items.length}</TableCell>
                      <TableCell>{wkAvg.toFixed(1)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {full ? "Full coverage" : "Partial"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : null}

          {pulses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Mood</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Best moment</TableHead>
                  <TableHead>Could be better</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pulses
                  .slice()
                  .reverse()
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{formatKeyLong(dayKey(p.pulseDate))}</TableCell>
                      <TableCell>
                        <Badge variant={scoreBadgeVariant(p.sentimentScore)}>
                          {p.sentimentScore} · {SENTIMENT_LABELS[p.sentimentScore - 1]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.moodTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.moodTags.map((t) => (
                              <Badge key={t} variant="outline">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-52 truncate text-muted-foreground">
                        {p.bestMoment ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-52 truncate text-muted-foreground">
                        {p.improvementText ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              No pulses recorded in this period.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relationship signals</CardTitle>
          <CardDescription>
            Based on recognitions exchanged within the selected period. Recognition is voluntary —
            a quiet period does not imply conflict.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {connections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colleague</TableHead>
                  <TableHead>Recognized them</TableHead>
                  <TableHead>Recognized by them</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((c) => (
                  <TableRow key={c.peerId}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.given === 0 ? "—" : `${c.given}×`}</TableCell>
                    <TableCell>{c.received === 0 ? "—" : `${c.received}×`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              {employee.name.split(" ")[0]} has not exchanged recognitions in this period.
            </p>
          )}

          {limitedTeammates.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">
                Teammates with limited interaction signal
              </h3>
              <p className="text-muted-foreground text-xs">
                No recognitions exchanged in this period with{" "}
                {limitedTeammates.map((t) => t.name).join(", ")}.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {topTags.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          Most common mood tags this period:{" "}
          {topTags.map(([t, n]) => `${t} (${n})`).join(" · ")}.
        </p>
      ) : null}

      {last30Pending !== null ? (
        <p className="text-muted-foreground text-sm">
          {last30Pending === 0
            ? "Pulse recorded every one of the last 30 days."
            : `No pulse recorded on ${last30Pending} of the last 30 days.`}
        </p>
      ) : null}
    </main>
  );
}