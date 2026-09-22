import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeNav } from "@/components/employee/nav";
import { NotificationPreferencesForm } from "@/components/employee/preferences-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { db } from "@/db";
import { notificationPreferences, users } from "@/db/schema";
import { requireAuth } from "@/lib/permissions";

export default async function ProfilePage() {
  const user = await requireAuth();

  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    with: {
      department: true,
      team: true,
      manager: true,
    },
  });

  const prefs = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, user.id),
  });

  const fields: Array<[string, string]> = [
    ["Email", user.email],
    ["Role", user.role],
    ["Job title", user.jobTitle ?? "—"],
    ["Location", user.location ?? "—"],
    ["Department", profile?.department?.name ?? "—"],
    ["Team", profile?.team?.name ?? "—"],
    ["Manager", profile?.manager?.name ?? "—"],
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-sm">{user.name}</p>
        </div>
        <SignOutButton />
      </header>

      <EmployeeNav showTeam={false} />

      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground text-sm">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm
            prefs={{
              dailyPulseEnabled: prefs?.dailyPulseEnabled ?? true,
              emailEnabled: prefs?.emailEnabled ?? false,
              slackEnabled: prefs?.slackEnabled ?? false,
              teamsEnabled: prefs?.teamsEnabled ?? false,
              reminderTime: prefs?.reminderTime ?? null,
              timezone: prefs?.timezone ?? null,
            }}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Badge variant="outline">{user.active ? "Active" : "Inactive"}</Badge>
      </div>
    </main>
  );
}