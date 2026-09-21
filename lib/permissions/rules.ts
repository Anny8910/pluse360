import { ROLE_ENUM_VALUES } from "@/db/schema";

export type Role = (typeof ROLE_ENUM_VALUES)[number];
export const ROLE_ORDER: readonly Role[] = ROLE_ENUM_VALUES;

export const ROLE_RANK: Record<Role, number> = {
  employee: 10,
  manager: 20,
  hr: 30,
  admin: 40,
};

export interface UserLike {
  id: string;
  organizationId: string | null;
  role: string;
}

export const roleRank = (role: string): number => ROLE_RANK[role as Role] ?? 0;

export function hasRole(user: UserLike, minRole: Role): boolean {
  return roleRank(user.role) >= roleRank(minRole);
}

export const isSameOrganization = (a: UserLike, b: UserLike): boolean =>
  !!a.organizationId && a.organizationId === b.organizationId;

export const canAccessHrModule = (user: UserLike): boolean => hasRole(user, "hr");

export const canAccessAdminModule = (user: UserLike): boolean => hasRole(user, "admin");

export const canViewEmployeeData = (user: UserLike): boolean => hasRole(user, "manager");

export const canViewAnalytics = (user: UserLike): boolean => hasRole(user, "manager");

export const roleHome = (role: string): string => {
  if (roleRank(role) >= ROLE_RANK.admin) return "/admin";
  if (roleRank(role) >= ROLE_RANK.hr) return "/hr";
  return "/employee";
};
