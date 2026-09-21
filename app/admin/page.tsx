import { count, eq } from "drizzle-orm";
import Link from "next/link";
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
import { departments, organizations, teams, users } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

export default async function AdminOverviewPage() {
  const user = await requireRole("admin");

  const [orgRows, userRows, deptRows, teamRows, recentUsers] = await Promise.all([
    db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1),
    db.select({ total: count() }).from(users).where(eq(users.organizationId, user.organizationId)),
    db
      .select({ total: count() })
      .from(departments)
      .where(eq(departments.organizationId, user.organizationId)),
    db.select({ total: count() }).from(teams).where(eq(teams.organizationId, user.organizationId)),
    db.query.users.findMany({
      where: eq(users.organizationId, user.organizationId),
      orderBy: (u, { desc }) => [desc(u.createdAt)],
      with: { department: true, team: true },
      limit: 8,
    }),
  ]);

  const org = orgRows[0];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{org?.name ?? "Organization"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {org?.slug} · {org?.timezone}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Users" value={userRows[0]?.total ?? 0} />
        <StatCard label="Departments" value={deptRows[0]?.total ?? 0} />
        <StatCard label="Teams" value={teamRows[0]?.total ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently added users</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.department?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.active ? "default" : "destructive"}>
                        {u.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm">
        Manage{" "}
        <Link href="/admin/departments" className="text-foreground underline">
          departments
        </Link>
        ,{" "}
        <Link href="/admin/teams" className="text-foreground underline">
          teams
        </Link>
        ,{" "}
        <Link href="/admin/users" className="text-foreground underline">
          users
        </Link>
        , or{" "}
        <Link href="/admin/settings" className="text-foreground underline">
          organization settings
        </Link>
        .
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="text-foreground text-3xl font-semibold">{value}</span>
        <span className="text-muted-foreground text-sm">{label}</span>
      </CardContent>
    </Card>
  );
}
