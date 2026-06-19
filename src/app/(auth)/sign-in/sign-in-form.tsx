"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/button";
import { signIn, type AuthState } from "../actions";
import { TextField, Alert } from "../_components/auth-ui";

const initial: AuthState = {};

export function SignInForm({
  redirect,
  linkError,
}: {
  redirect: string;
  linkError?: string;
}) {
  const [state, formAction, pending] = useActionState(signIn, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="redirect" value={redirect} />

      {(state.error || linkError) && (
        <Alert kind="error">{state.error ?? linkError}</Alert>
      )}

      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <Link
        href="/reset-password"
        className="text-center text-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
        style={{ color: "var(--lm-warm-text)" }}
      >
        Forgot password?
      </Link>
    </form>
  );
}
