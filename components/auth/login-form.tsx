"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/actions";

const clientRoleHome = (role: string): string =>
  role === "admin" ? "/admin" : role === "hr" ? "/hr" : "/employee";

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signIn, undefined);

  useEffect(() => {
    if (state?.ok) router.push(clientRoleHome(state.user.role));
  }, [state, router]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandMark className="size-14 drop-shadow-sm" />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to <span className="text-primary">Pulse360</span>
          </h1>
          <CardDescription>
            Workplace intelligence from 60-second daily pulses.
          </CardDescription>
        </div>
      </div>
      <Card className="w-full max-w-sm">
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state && !state.ok ? (
              <p className="text-destructive text-sm" role="alert">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}