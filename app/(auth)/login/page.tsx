import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser, roleHome } from "@/lib/permissions";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));
  return <LoginForm />;
}
