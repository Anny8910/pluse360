import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { dailyPulses } from "@/db/schema";
import { requireAuth } from "@/lib/permissions";
import { formatDateKey } from "@/lib/utils/date";

export default async function EmployeeHistoryPage() {
  const user = await requireAuth();

  const pulses = await db.query.dailyPulses.findMany({
    where: eq(dailyPulses.employeeId, user.id),
    orderBy: (p, { desc }) => [desc(p.pulseDate)],
    limit: 60,
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pulse history</h1>
          <p className="text-muted-foreground text-sm">
            Your past check-ins, newest first.
          </p>
        </div>
        <HeaderActions />
      </header>

      <EmployeeNav showTeam={false} />

      <Card>
        <CardContent className="p-0">
          {pulses.length === 0 ? (
            <p className="text-muted-foreground p-6 text-sm">
              Nothing here yet — record your first pulse from the Pulse page.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Best moment</TableHead>
                  <TableHead>Could be better</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pulses.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatDateKey(p.pulseDate.toISOString().slice(0, 10))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.sentimentScore}/5</Badge>
                    </TableCell>
                    <TableCell className="max-w-44 text-muted-foreground">
                      <div className="flex flex-wrap gap-1">
                        {p.moodTags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-52 text-muted-foreground">
                      {p.bestMoment}
                    </TableCell>
                    <TableCell className="max-w-52 text-muted-foreground">
                      {p.improvementText ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}