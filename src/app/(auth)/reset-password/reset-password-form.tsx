"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { requestPasswordReset, type AuthState } from "../actions";
import { TextField, Alert } from "../_components/auth-ui";

const initial: AuthState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initial,
  );

  // The action always returns the same generic success (no enumeration).
  if (state.success) {
    return <Alert kind="success">{state.success}</Alert>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
