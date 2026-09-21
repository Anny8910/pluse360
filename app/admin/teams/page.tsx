import { eq } from "drizzle-orm";
import { TeamCreateForm, TeamRenameForm, TeamDeleteForm } from "@/components/admin/forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { departments, teams } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

export default async function AdminTeamsPage() {
  const user = await requireRole("admin");

  const deptRows = await db.query.departments.findMany({
    where: eq(departments.organizationId, user.organizationId),
    orderBy: (d, { asc }) => [asc(d.name)],
  });

  const teamRows = await db.query.teams.findMany({
    where: eq(teams.organizationId, user.organizationId),
    orderBy: (t, { asc }) => [asc(t.name)],
    with: { department: { columns: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a team</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamCreateForm departments={deptRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {teamRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No teams yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Edit</TableHead>
                  <TableHead>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.department?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <TeamRenameForm
                        id={row.id}
                        name={row.name}
                        departmentId={row.departmentId}
                        departments={deptRows}
                      />
                    </TableCell>
                    <TableCell>
                      <TeamDeleteForm id={row.id} name={row.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
