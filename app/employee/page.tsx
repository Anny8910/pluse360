import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/permissions";

export default async function EmployeeHomePage() {
  const user = await requireAuth();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employee Workspace</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user.name}.</p>
        </div>
        <SignOutButton />
      </header>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{user.role}</Badge>
        {user.jobTitle ? <Badge variant="outline">{user.jobTitle}</Badge> : null}
      </div>
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your daily pulse, recognitions, and team highlights land here in Phase 4.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
