import { eq } from "drizzle-orm";
import {
  DepartmentCreateForm,
  DepartmentRenameForm,
  DepartmentDeleteForm,
} from "@/components/admin/forms";
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
import { departments } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

export default async function AdminDepartmentsPage() {
  const user = await requireRole("admin");

  const rows = await db.query.departments.findMany({
    where: eq(departments.organizationId, user.organizationId),
    orderBy: (d, { asc }) => [asc(d.name)],
    with: { teams: { columns: { id: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a department</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No departments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Rename</TableHead>
                  <TableHead>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.teams.length}</TableCell>
                    <TableCell>
                      <DepartmentRenameForm id={row.id} name={row.name} />
                    </TableCell>
                    <TableCell>
                      <DepartmentDeleteForm id={row.id} name={row.name} />
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
