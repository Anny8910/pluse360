import { and, count, eq, gte } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrNav } from "@/components/hr/nav";
import { HeaderActions } from "@/components/auth/header-actions";
import { db } from "@/db";
import { concerns, dailyPulses, organizations, users } from "@/db/schema";
import { buildInsights } from "@/lib/ai/insights";
import {
  averageScore,
  meetsThreshold,
  participationRate,
  sentimentBands,
} from "@/lib/analytics/aggregate";
import { requireRole } from "@/lib/permissions";
import { daysAgoKey, todayKey, utcDateKey } from "@/lib/utils/date";

export default async function HrOverviewPage() {
  const user = await requireRole("hr");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);
  const timezone = org?.timezone ?? null;

  const [activeTotal, todayCount, weekPulses, openConcerns, pulseTotal] =
    await Promise.all([
      db
        .select({ total: count() })
        .from(users)
        .where(and(eq(users.organizationId, user.organizationId), eq(users.active, true))),
      db
        .select({ total: count() })
        .from(dailyPulses)
        .where(
          and(
            eq(dailyPulses.organizationId, user.organizationId),
            eq(dailyPulses.pulseDate, utcDateKey(todayKey(timezone)))
          )
        ),
      db
        .select({ sentimentScore: dailyPulses.sentimentScore })
        .from(dailyPulses)
        .where(
          and(
            eq(dailyPulses.organizationId, user.organizationId),
            gte(dailyPulses.pulseDate, utcDateKey(daysAgoKey(6, timezone)))
          )
        ),
      db
        .select({ total: count() })
        .from(concerns)
        .where(
          and(
            eq(concerns.organizationId, user.organizationId),
            eq(concerns.status, "new")
          )
        ),
      db
        .select({ total: count() })
        .from(dailyPulses)
        .where(eq(dailyPulses.organizationId, user.organizationId)),
    ]);

  const active = activeTotal[0]?.total ?? 0;
  const scores = weekPulses.map((p) => p.sentimentScore);
  const band = sentimentBands(scores);
  const participation = participationRate(todayCount[0]?.total ?? 0, active);
  const weekAverage = averageScore(scores);
  const open = openConcerns[0]?.total ?? 0;

  const insights = buildInsights({
    thresholdMet: meetsThreshold(active),
    participationToday: participation,
    weekAverage,
    weekPositive: band.positive,
    weekNegative: band.negative,
    openConcerns: open,
    totalPulses: pulseTotal[0]?.total ?? 0,
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HR Hub</h1>
          <p className="text-muted-foreground text-sm">
            Organization-wide wellbeing, at a glance.
          </p>
        </div>
        <HeaderActions />
      </header>

      <HrNav />

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{user.role}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Participation today"
          value={participation === null ? "—" : `${participation.toFixed(0)}%`}
        />
        <StatCard
          label="Avg sentiment (7d)"
          value={weekAverage === null ? "—" : weekAverage.toFixed(2)}
        />
        <StatCard
          label="Open concerns"
          value={String(open)}
        />
        <StatCard label="Active employees" value={String(active)} />
      </div>

      {!meetsThreshold(active) ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Organization metrics need at least 5 active employees to display.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {insights.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {insights.map((line, i) => (
                <li key={i} className="text-muted-foreground text-sm">
                  {line}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-muted-foreground text-sm">
        Explore{" "}
        <Link href="/hr/employees" className="text-foreground underline">
          employees
        </Link>
        ,{" "}
        <Link href="/hr/concerns" className="text-foreground underline">
          concerns
        </Link>
        , and{" "}
        <Link href="/hr/reports" className="text-foreground underline">
          reports
        </Link>
        .
      </p>
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