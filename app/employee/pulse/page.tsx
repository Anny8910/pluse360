import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeNav } from "@/components/employee/nav";
import { HeaderActions } from "@/components/auth/header-actions";
import { PulseForm } from "@/components/employee/pulse-form";
import { db } from "@/db";
import { dailyPulses, organizations } from "@/db/schema";
import { requireAuth } from "@/lib/permissions";
import { todayKey, utcDateKey } from "@/lib/utils/date";

export default async function EmployeeSubmitPage() {
  const user = await requireAuth();

  const org = user.organizationId
    ? await db.query.organizations.findFirst({
        where: eq(organizations.id, user.organizationId),
        columns: { timezone: true },
      })
    : null;

  const todayPulse = await db.query.dailyPulses.findFirst({
    where: and(
      eq(dailyPulses.employeeId, user.id),
      eq(dailyPulses.pulseDate, utcDateKey(todayKey(org?.timezone)))
    ),
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily pulse</h1>
          <p className="text-muted-foreground text-sm">
            Takes about 60 seconds. One per day.
          </p>
        </div>
        <HeaderActions />
      </header>

      <EmployeeNav showTeam={false} />

      <Card>
        <CardHeader>
          <CardTitle>
            {todayPulse ? "Pulse recorded" : "How was your day?"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayPulse ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {todayPulse.sentimentScore}/5
                </Badge>
                {todayPulse.moodTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              {todayPulse.bestMoment ? (
                <p className="text-muted-foreground text-sm">
                  <span className="font-medium text-foreground">Best moment:</span>{" "}
                  {todayPulse.bestMoment}
                </p>
              ) : null}
              {todayPulse.improvementText ? (
                <p className="text-muted-foreground text-sm">
                  <span className="font-medium text-foreground">Could be better:</span>{" "}
                  {todayPulse.improvementText}
                </p>
              ) : null}
              <p className="text-muted-foreground text-sm">
                You can{" "}
                <Link href="/employee/history" className="text-foreground underline">
                  review your history
                </Link>{" "}
                or come back tomorrow.
              </p>
            </div>
          ) : (
            <PulseForm />
          )}
        </CardContent>
      </Card>
    </main>
  );
}