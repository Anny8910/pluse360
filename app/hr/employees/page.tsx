import { and, eq, inArray } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrNav } from "@/components/hr/nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
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
import { requireRole } from "@/lib/permissions";
import { todayKey, utcDateKey } from "@/lib/utils/date";

export default async function HrEmployeesPage() {
  const user = await requireRole("hr");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  const rows = await db.query.users.findMany({
    where: and(
      eq(users.organizationId, user.organizationId),
      eq(users.active, true)
    ),
    orderBy: (u, { asc }) => [asc(u.name)],
    with: { department: true, team: true, manager: true },
  });

  const ids = rows.map((r) => r.id);
  const todaySubmitted =
    ids.length > 0
      ? await db
          .select({ employeeId: dailyPulses.employeeId })
          .from(dailyPulses)
          .where(
            and(
              eq(dailyPulses.organizationId, user.organizationId),
              inArray(dailyPulses.employeeId, ids),
              eq(dailyPulses.pulseDate, utcDateKey(todayKey(org?.timezone)))
            )
          )
      : [];
  const submitted = new Set(todaySubmitted.map((t) => t.employeeId));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm">
            Everyone active in {org?.name} ({rows.length}).
          </p>
        </div>
        <SignOutButton />
      </header>

      <HrNav />

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department / Team</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Pulse today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-muted-foreground text-xs">{r.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.department?.name ?? "—"} / {r.team?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.manager?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={submitted.has(r.id) ? "default" : "outline"}>
                      {submitted.has(r.id) ? "Recorded" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}