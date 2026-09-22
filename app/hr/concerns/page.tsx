import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConcernCreateForm, ConcernUpdateForm, HrNoteForm } from "@/components/hr/concern-forms";
import { HrNav } from "@/components/hr/nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { db } from "@/db";
import { concerns } from "@/db/schema";
import { requireRole } from "@/lib/permissions";

export default async function HrConcernsPage() {
  const user = await requireRole("hr");

  const rows = await db.query.concerns.findMany({
    where: eq(concerns.organizationId, user.organizationId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    with: {
      reporter: { columns: { name: true } },
      hrNotes: { with: { author: { columns: { name: true } } } },
    },
    limit: 100,
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Concerns</h1>
          <p className="text-muted-foreground text-sm">
            Log and track workplace concerns.
          </p>
        </div>
        <SignOutButton />
      </header>

      <HrNav />

      <Card>
        <CardHeader>
          <CardTitle>Log a concern</CardTitle>
        </CardHeader>
        <CardContent>
          <ConcernCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open concerns</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No concerns logged.</p>
          ) : (
            rows.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 rounded-lg border border-input p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{c.category}</Badge>
                  <Badge
                    variant={
                      c.severity === "high"
                        ? "destructive"
                        : c.severity === "medium"
                          ? "default"
                          : "outline"
                    }
                  >
                    {c.severity}
                  </Badge>
                  <Badge variant="outline">{c.status}</Badge>
                  <span className="ml-auto text-muted-foreground text-xs">
                    {c.anonymous
                      ? "Anonymous"
                      : c.reporter?.name ?? "Unknown reporter"}
                    {c.visibility !== "hr_only" ? ` · ${c.visibility}` : ""}
                  </span>
                </div>
                <p className="text-sm">{c.description}</p>
                {c.hrNotes.length > 0 ? (
                  <ul className="flex flex-col gap-1 border-l-2 border-foreground/10 pl-3">
                    {c.hrNotes.map((n) => (
                      <li key={n.id} className="text-muted-foreground text-sm">
                        <span className="font-medium text-foreground">
                          {n.author?.name ?? "HR"}:
                        </span>{" "}
                        {n.note}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <ConcernUpdateForm
                    id={c.id}
                    status={c.status}
                    severity={c.severity}
                  />
                  <HrNoteForm concernId={c.id} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}