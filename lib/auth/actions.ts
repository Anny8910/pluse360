"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { signInSchema } from "@/lib/validation/auth";

export type SignInResult =
  { ok: true; user: { name: string; role: string } } | { ok: false; error: string };

export async function signIn(
  _prev: SignInResult | undefined,
  formData: FormData
): Promise<SignInResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const { user } = await auth.api.signInEmail({
      body: parsed.data,
    });
    revalidatePath("/", "layout");
    return { ok: true, user: { name: user.name, role: user.role } };
  } catch {
    return { ok: false, error: "Invalid email or password." };
  }
}

export async function signOut(): Promise<void> {
  await auth.api.signOut({
    headers: await headers(),
  });
  revalidatePath("/", "layout");
}
