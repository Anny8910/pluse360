"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export function HrNav() {
  const pathname = usePathname();
  const links = [
    { href: "/hr", label: "Overview" },
    { href: "/hr/employees", label: "Employees" },
    { href: "/hr/concerns", label: "Concerns" },
    { href: "/hr/reports", label: "Reports" },
  ];

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {links.map((link) => {
        const active =
          link.href === "/hr"
            ? pathname === "/hr"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-foreground/5 font-medium text-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}