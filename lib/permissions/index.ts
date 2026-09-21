import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { auth } from "@/lib/auth";
import { hasRole, roleHome, type Role } from "@/lib/permissions/rules";

export * from "@/lib/permissions/rules";

export async function getCurrentUser(): Promise<User | null> {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });
  if (!sessionData?.user) return null;

  const [user] = await db.select().from(users).where(eq(users.id, sessionData.user.id)).limit(1);

  if (!user || !user.active) return null;
  return user;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(minRole: Role): Promise<User> {
  const user = await requireAuth();
  if (!hasRole(user, minRole)) redirect(roleHome(user.role));
  return user;
}
