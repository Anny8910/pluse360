import { and, eq, gte, inArray } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeNav } from "@/components/employee/nav";
import { HeaderActions } from "@/components/auth/header-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { dailyPulses, organizations, users } from "@/db/schema";
import {
  averageScore,
  meetsThreshold,
  participationRate,
  sentimentBands,
  trendSeries,
} from "@/lib/analytics/aggregate";
import { requireRole } from "@/lib/permissions";
import { daysAgoKey, formatDateKey, todayKey, utcDateKey } from "@/lib/utils/date";

export default async function ManagerTeamPage() {
  const user = await requireRole("manager");

  const org = user.organizationId
    ? await db.query.organizations.findFirst({
        where: eq(organizations.id, user.organizationId),
        columns: { timezone: true },
      })
    : null;
  const timezone = org?.timezone;

  const members = await db.query.users.findMany({
    where: and(
      eq(users.organizationId, user.organizationId),
      eq(users.managerId, user.id),
      eq(users.active, true)
    ),
    orderBy: (u, { asc }) => [asc(u.name)],
    with: { team: true, department: true },
  });

  const memberIds = members.map((m) => m.id);
  const today = todayKey(timezone);

  const [todayPulses, weekPulses] = await Promise.all([
    memberIds.length > 0
      ? db
          .select({
            employeeId: dailyPulses.employeeId,
            sentimentScore: dailyPulses.sentimentScore,
            pulseDate: dailyPulses.pulseDate,
          })
          .from(dailyPulses)
          .where(
            and(
              eq(dailyPulses.organizationId, user.organizationId),
              inArray(dailyPulses.employeeId, memberIds),
              eq(dailyPulses.pulseDate, utcDateKey(today))
            )
          )
      : Promise.resolve([]),
    memberIds.length > 0
      ? db
          .select({
            employeeId: dailyPulses.employeeId,
            sentimentScore: dailyPulses.sentimentScore,
            pulseDate: dailyPulses.pulseDate,
          })
          .from(dailyPulses)
          .where(
            and(
              eq(dailyPulses.organizationId, user.organizationId),
              inArray(dailyPulses.employeeId, memberIds),
              gte(dailyPulses.pulseDate, utcDateKey(daysAgoKey(6, timezone)))
            )
          )
      : Promise.resolve([]),
  ]);

  const todaySubmitted = new Set(todayPulses.map((p) => p.employeeId));

  const latestByMember = new Map<string, { score: number; key: string }>();
  for (const p of weekPulses) {
    const key = p.pulseDate.toISOString().slice(0, 10);
    const prev = latestByMember.get(p.employeeId);
    if (!prev || prev.key < key) {
      latestByMember.set(p.employeeId, { score: p.sentimentScore, key });
    }
  }

  const dayLabels = Array.from({ length: 7 }, (_, i) => 6 - i);
  const trend = trendSeries(
    dayLabels.map((offset) => {
      const key = daysAgoKey(offset, timezone);
      return {
        key,
        label: formatDateKey(key),
        scores: weekPulses
          .filter((p) => p.pulseDate.toISOString().slice(0, 10) === key)
          .map((p) => p.sentimentScore),
      };
    })
  );

  const thresholdMet = meetsThreshold(members.length);
  const participation = participationRate(todaySubmitted.size, members.length);
  const band = sentimentBands(weekPulses.map((p) => p.sentimentScore));
  const weekAverage = averageScore(weekPulses.map((p) => p.sentimentScore));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Insights about your direct reports.
          </p>
        </div>
        <HeaderActions />
      </header>

      <EmployeeNav showTeam />

      {members.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              You don&apos;t have any direct reports yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {!thresholdMet ? (
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Team analytics unlock once your team has at least 5 active
                  members ({members.length} now). Individual check-ins are listed
                  below.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Participation today"
              value={
                participation === null
                  ? "—"
                  : `${participation.toFixed(0)}% (${todaySubmitted.size}/${members.length})`
              }
            />
            <StatCard
              label="Avg sentiment (7d)"
              value={weekAverage === null ? "—" : weekAverage.toFixed(2)}
            />
            <StatCard
              label="Positive rate (7d)"
              value={band.positive === null ? "—" : `${band.positive}%`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trend — last 7 days</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {trend.map((day) => (
                      <TableHead key={day.key} className="text-center">
                        {day.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    {trend.map((day) => (
                      <TableCell key={day.key} className="text-center">
                        {day.avg === null ? "—" : day.avg.toFixed(2)}
                        <span className="block text-xs text-muted-foreground">
                          {day.count}/5
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your team</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Latest pulse</TableHead>
                    <TableHead>Today</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const latest = latestByMember.get(m.id);
                    const doneToday = todaySubmitted.has(m.id);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {m.jobTitle ?? m.role}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.team?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {latest
                            ? `${formatDateKey(latest.key)} · ${latest.score}/5`
                            : "No pulse yet"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={doneToday ? "default" : "outline"}>
                            {doneToday ? "Recorded" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="text-foreground text-2xl font-semibold">{value}</span>
        <span className="text-muted-foreground text-sm">{label}</span>
      </CardContent>
    </Card>
  );
}