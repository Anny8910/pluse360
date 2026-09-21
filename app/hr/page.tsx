import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/permissions";

export default async function HrHomePage() {
  const user = await requireRole("hr");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HR Hub</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user.name}.</p>
        </div>
        <SignOutButton />
      </header>
      <Badge variant="secondary" className="w-fit">
        {user.role}
      </Badge>
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Concerns, employee feedback, and intervention workflows land here in Phase 4.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
