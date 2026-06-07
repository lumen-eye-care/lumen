"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { signUp, type AuthState } from "../actions";
import { TextField, Alert } from "../_components/auth-ui";
import { PASSWORD_MIN } from "@/lib/auth-schemas";

const initial: AuthState = {};

export function SignUpForm({ redirect }: { redirect: string }) {
  const [state, formAction, pending] = useActionState(signUp, initial);

  // Email confirmation required: the action returns a success message instead of
  // redirecting. Swap the form for a "check your email" panel.
  if (state.success) {
    return <Alert kind="success">{state.success}</Alert>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="redirect" value={redirect} />

      {state.error && <Alert kind="error">{state.error}</Alert>}

      <TextField
        label="Name"
        name="name"
        type="text"
        autoComplete="name"
        required
        error={state.fieldErrors?.name}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN}
        required
        error={state.fieldErrors?.password}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
