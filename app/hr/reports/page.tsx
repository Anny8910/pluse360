import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrNav } from "@/components/hr/nav";
import { ReportGenerateForm } from "@/components/hr/report-form";
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
import { monthlyReports } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

export default async function HrReportsPage() {
  const user = await requireRole("hr");

  const rows = await db.query.monthlyReports.findMany({
    where: eq(monthlyReports.organizationId, user.organizationId),
    orderBy: (r, { desc }) => [desc(r.year), desc(r.month)],
    limit: 24,
  });

  const monthName = (m: number) =>
    new Date(0, m - 1, 1).toLocaleString("en-US", { month: "long" });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly reports</h1>
          <p className="text-muted-foreground text-sm">
            Aggregate insights over each month.
          </p>
        </div>
        <SignOutButton />
      </header>

      <HrNav />

      <Card>
        <CardHeader>
          <CardTitle>Generate a report</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportGenerateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="text-muted-foreground p-6 text-sm">
              No reports generated yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Avg sentiment</TableHead>
                  <TableHead>Positive / Negative</TableHead>
                  <TableHead>Generated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const data = r.reportJson as {
                    monthAverage?: number | null;
                    monthBand?: { positive?: number | null; negative?: number | null } | null;
                  } | null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {monthName(r.month)} {r.year}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {data?.monthAverage === null || data?.monthAverage === undefined
                          ? "—"
                          : Number(data.monthAverage).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {data?.monthBand?.positive === null ||
                        data?.monthBand?.positive === undefined
                          ? "—"
                          : `${data.monthBand.positive}% / ${
                              data.monthBand.negative ?? "—"
                            }%`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.generatedAt
                          ? new Intl.DateTimeFormat("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(r.generatedAt)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}