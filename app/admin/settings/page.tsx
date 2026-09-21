import { eq } from "drizzle-orm";
import { OrgSettingsForm } from "@/components/admin/forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

export default async function AdminSettingsPage() {
  const user = await requireRole("admin");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  if (!org) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">Organization not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization settings</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm org={{ name: org.name, slug: org.slug, timezone: org.timezone }} />
        </CardContent>
      </Card>
    </div>
  );
}
