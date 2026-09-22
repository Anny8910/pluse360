import { and, count, eq } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeNav } from "@/components/employee/nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { db } from "@/db";
import { dailyPulses, organizations } from "@/db/schema";
import { requireAuth } from "@/lib/permissions";
import { canViewAnalytics } from "@/lib/permissions/rules";
import { todayKey, utcDateKey } from "@/lib/utils/date";

export default async function EmployeeHomePage() {
  const user = await requireAuth();

  const org = user.organizationId
    ? await db.query.organizations.findFirst({
        where: eq(organizations.id, user.organizationId),
        columns: { timezone: true, name: true },
      })
    : null;

  const todayPulse = await db.query.dailyPulses.findFirst({
    where: and(
      eq(dailyPulses.employeeId, user.id),
      eq(dailyPulses.pulseDate, utcDateKey(todayKey(org?.timezone)))
    ),
  });

  const [pulseCount] = await db
    .select({ total: count() })
    .from(dailyPulses)
    .where(eq(dailyPulses.employeeId, user.id));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employee Workspace</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, {user.name}.
          </p>
        </div>
        <SignOutButton />
      </header>

      <EmployeeNav showTeam={canViewAnalytics(user)} />

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{user.role}</Badge>
        {user.jobTitle ? <Badge variant="outline">{user.jobTitle}</Badge> : null}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          {todayPulse ? (
            <p className="text-sm">
              <Badge variant="secondary">Pulse recorded today</Badge>{" "}
              {todayPulse.moodTags.length > 0
                ? todayPulse.moodTags.join(", ")
                : null}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              You haven&apos;t recorded today&apos;s pulse yet.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {!todayPulse ? (
              <Link href="/employee/pulse" className={buttonVariants()}>
                Record today&apos;s pulse
              </Link>
            ) : null}
            <Link
              href="/employee/history"
              className={buttonVariants({ variant: "outline" })}
            >
              View history
            </Link>
            <Link
              href="/employee/profile"
              className={buttonVariants({ variant: "outline" })}
            >
              Profile
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm">
        You&apos;ve shared {pulseCount.total} pulse{pulseCount.total === 1 ? "" : "s"} so
        far.
      </p>
    </main>
  );
}