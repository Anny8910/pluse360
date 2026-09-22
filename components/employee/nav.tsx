"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const links = [
  { href: "/employee", label: "Dashboard" },
  { href: "/employee/pulse", label: "Pulse" },
  { href: "/employee/history", label: "History" },
  { href: "/employee/profile", label: "Profile" },
];

export function EmployeeNav({ showTeam }: { showTeam: boolean }) {
  const pathname = usePathname();
  const items = showTeam
    ? [...links, { href: "/manager", label: "Team" }]
    : links;

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {items.map((link) => {
        const active =
          link.href === "/employee"
            ? pathname === "/employee"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}