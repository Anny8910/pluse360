import { and, eq, inArray } from "drizzle-orm";
import {
  UserActiveForm,
  UserCreateForm,
  UserEditForm,
  UserPasswordForm,
} from "@/components/admin/forms";
import { Badge } from "@/components/ui/badge";
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
import { departments, teams, users } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

export default async function AdminUsersPage() {
  const user = await requireRole("admin");

  const deptRows = await db.query.departments.findMany({
    where: eq(departments.organizationId, user.organizationId),
    orderBy: (d, { asc }) => [asc(d.name)],
  });
  const teamRows = await db.query.teams.findMany({
    where: eq(teams.organizationId, user.organizationId),
    orderBy: (t, { asc }) => [asc(t.name)],
  });
  const managerRows = await db.query.users.findMany({
    where: and(
      eq(users.organizationId, user.organizationId),
      inArray(users.role, ["manager", "hr", "admin"]),
      eq(users.active, true)
    ),
    orderBy: (u, { asc }) => [asc(u.name)],
    columns: { id: true, name: true, role: true },
  });
  const userRows = await db.query.users.findMany({
    where: eq(users.organizationId, user.organizationId),
    orderBy: (u, { asc }) => [asc(u.name)],
    with: { department: true, team: true, manager: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a user</CardTitle>
        </CardHeader>
        <CardContent>
          <UserCreateForm departments={deptRows} teams={teamRows} managers={managerRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({userRows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department / Team</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>Password</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-muted-foreground text-xs">{row.email}</div>
                    {row.jobTitle ? (
                      <div className="text-muted-foreground text-xs">{row.jobTitle}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.department?.name ?? "—"} / {row.team?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.manager?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.active ? "default" : "destructive"}>
                      {row.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <UserEditForm
                      user={{
                        id: row.id,
                        name: row.name,
                        role: row.role,
                        departmentId: row.departmentId,
                        teamId: row.teamId,
                        managerId: row.managerId,
                        jobTitle: row.jobTitle,
                        location: row.location,
                      }}
                      departments={deptRows}
                      teams={teamRows}
                      managers={managerRows}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-3">
                      <UserPasswordForm id={row.id} email={row.email} />
                      <UserActiveForm
                        id={row.id}
                        active={row.active}
                        disabled={row.id === user.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
