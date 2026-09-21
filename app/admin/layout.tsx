import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireRole } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("admin");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Admin Console
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
        </div>
        <SignOutButton />
      </header>
      <AdminNav />
      <div className="flex flex-1 flex-col gap-6">{children}</div>
    </main>
  );
}
