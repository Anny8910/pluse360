import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function HeaderActions() {
  return (
    <div className="flex items-center gap-1.5">
      <ThemeToggle />
      <SignOutButton />
    </div>
  );
}