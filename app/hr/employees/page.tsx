import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { CalendarClock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrNav } from "@/components/hr/nav";
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
import { requireRole } from "@/lib/permissions";
import { todayKey, utcDateKey } from "@/lib/utils/date";

export default async function HrEmployeesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().toLowerCase();

  const user = await requireRole("hr");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  const allRows = await db.query.users.findMany({
    where: and(
      eq(users.organizationId, user.organizationId),
      eq(users.active, true)
    ),
    orderBy: (u, { asc }) => [asc(u.name)],
    with: { department: true, team: true, manager: true },
  });

  const rows = q
    ? allRows.filter((r) => {
        const haystack = [
          r.name,
          r.email,
          r.role,
          r.jobTitle,
          r.department?.name,
          r.team?.name,
          r.manager?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
    : allRows;

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
            Everyone active in {org?.name} ({allRows.length}).
          </p>
        </div>
        <HeaderActions />
      </header>

      <HrNav />

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-3">
        <form
          method="get"
          action="/hr/employees"
          className="flex items-center gap-2 px-1 pt-1"
        >
          <div className="relative w-full max-w-xs">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, email, role or team…"
              aria-label="Search employees"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:ring-3"
            />
          </div>
          <button
            type="submit"
            className="border-border bg-background hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm font-medium outline-none hover:text-foreground focus-visible:ring-3"
          >
            Search
          </button>
          {q ? (
            <Link
              href="/hr/employees"
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            >
              Clear
            </Link>
          ) : null}
          <span className="text-muted-foreground ml-auto text-sm">
            {rows.length} of {allRows.length} active
          </span>
        </form>
        {rows.length === 0 ? (
          <p className="text-muted-foreground p-4 text-sm">
            No employees match “{q}”.
          </p>
        ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department / Team</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Pulse today</TableHead>
                <TableHead className="text-right">Pulse log</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">
                      <Link
                        href={`/hr/employees/${r.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {r.name}
                      </Link>
                    </div>
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
                  <TableCell className="text-right">
                    <Link
                      href={`/hr/employees/${r.id}`}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      aria-label={`Pulse log for ${r.name}`}
                      title="View pulse log"
                    >
                      <CalendarClock aria-hidden="true" />
                    </Link>
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