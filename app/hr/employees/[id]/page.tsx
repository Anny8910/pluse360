import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, FileDown } from "lucide-react";
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
import { organizations } from "@/db/schema";
import { requireRole } from "@/lib/permissions";
import { SENTIMENT_LABELS } from "@/lib/validation/pulse";
import { dayKey, daysAgoKey } from "@/lib/utils/date";
import {
  loadEmployeeInsights,
  PULSE_PRESETS,
  resolvePulsePeriod,
} from "@/lib/hr/employee-insights";

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

function scoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 4) return "default";
  if (score <= 2) return "destructive";
  return "secondary";
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

  const period = resolvePulsePeriod(sp, org?.timezone);

  const insights = await loadEmployeeInsights({
    organizationId: user.organizationId,
    employeeId: id,
    start: period.start,
    end: period.end,
  });
  if (!insights) notFound();

  const { employee, pulses, connections, limitedTeammates, weekRows, count, avg, high, low, topTags } =
    insights;

  const getParam = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };

  const last30Pending =
    period.presetDays === 30 && !getParam("from") && !getParam("to")
      ? [...Array(30).keys()].filter(
          (i) => !pulses.some((p) => dayKey(p.pulseDate) === daysAgoKey(i, org?.timezone))
        ).length
      : null;

  const reportQuery = new URLSearchParams();
  if (getParam("preset")) reportQuery.set("preset", getParam("preset") as string);
  if (getParam("from")) reportQuery.set("from", getParam("from") as string);
  if (getParam("to")) reportQuery.set("to", getParam("to") as string);
  const reportHref = `/api/hr/employees/${employee.id}/report/pdf${
    reportQuery.toString() ? `?${reportQuery.toString()}` : ""
  }`;

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
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Pulse timeline</CardTitle>
            <CardDescription>
              Showing {count} pulse{count === 1 ? "" : "s"} from{" "}
              {formatKey(period.start)} to {formatKey(period.end)}. Choose a period below.
            </CardDescription>
          </div>
          <a
            href={reportHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
            title="Generate this employee's pulse report as a PDF"
          >
            <FileDown aria-hidden="true" className="size-4" />
            Report PDF
          </a>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-1.5">
              {PULSE_PRESETS.map((p) => {
                const active = !getParam("from") && !getParam("to") && period.presetDays === p.days;
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
                  defaultValue={period.start}
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
                  defaultValue={period.end}
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
                {weekRows.map(({ startKey, pulses: wk }) => {
                  const wkAvg = wk.reduce((s, p) => s + p.sentimentScore, 0) / wk.length;
                  const weekDays = 5;
                  const full = wk.length >= weekDays;
                  return (
                    <TableRow key={startKey}>
                      <TableCell className="font-medium">Week of {formatKeyLong(startKey)}</TableCell>
                      <TableCell>{wk.length}</TableCell>
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