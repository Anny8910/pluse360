import { redirect } from "next/navigation";
import { getCurrentUser, roleHome } from "@/lib/permissions";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? roleHome(user.role) : "/login");
}
