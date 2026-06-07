"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/button";
import { updatePassword, type AuthState } from "../actions";
import { TextField, Alert } from "../_components/auth-ui";
import { PASSWORD_MIN } from "@/lib/auth-schemas";

const initial: AuthState = {};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert kind="error">{state.error}</Alert>}

      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN}
        required
        error={state.fieldErrors?.password}
      />
      <TextField
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
