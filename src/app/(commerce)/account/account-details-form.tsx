"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Icon } from "@/components/atoms/icon";
import type { AuthState } from "@/app/(auth)/actions";
import { updateProfile } from "./actions";

const inputClass =
  "w-full rounded-md border border-[color:var(--lm-hair)] bg-[var(--lm-raise)] px-3 py-2.5 text-sm text-[color:var(--lm-text)] placeholder:text-[color:var(--lm-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]";

const errorClass = "mt-1 text-xs text-[color:var(--lm-warm)]";

type AccountDetailsFormProps = {
  email: string;
  name: string | null;
  phone: string | null;
};

export function AccountDetailsForm({
  email,
  name,
  phone,
}: AccountDetailsFormProps) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    updateProfile,
    {},
  );

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {/* Email — read-only (changing it needs auth re-verification). */}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">
          Email address
        </span>
        <input
          type="email"
          value={email}
          readOnly
          disabled
          className={`${inputClass} cursor-not-allowed opacity-70`}
          aria-describedby="email-hint"
        />
        <p id="email-hint" className="mt-1 text-xs text-[color:var(--lm-faint)]">
          Contact us if you need to change your email.
        </p>
      </label>

      {/* Name */}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">
          Full name
        </span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          defaultValue={name ?? ""}
          placeholder="Ama Owusu"
          className={inputClass}
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name && (
          <p id="name-error" className={errorClass}>
            {fieldErrors.name}
          </p>
        )}
      </label>

      {/* Phone (optional) */}
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-[color:var(--lm-text)]">
          Phone number{" "}
          <span className="font-normal text-[color:var(--lm-faint)]">
            (optional)
          </span>
        </span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={phone ?? ""}
          placeholder="024 123 4567"
          className={inputClass}
          aria-invalid={!!fieldErrors.phone}
          aria-describedby={fieldErrors.phone ? "phone-error" : "phone-hint"}
        />
        <p id="phone-hint" className="mt-1 text-xs text-[color:var(--lm-faint)]">
          Ghana number — so we can reach you about orders.
        </p>
        {fieldErrors.phone && (
          <p id="phone-error" className={errorClass}>
            {fieldErrors.phone}
          </p>
        )}
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-md px-3 py-2.5 text-sm"
          style={{
            background: "color-mix(in srgb, var(--lm-warm) 12%, transparent)",
            color: "var(--lm-warm)",
          }}
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="rounded-md px-3 py-2.5 text-sm"
          style={{
            background: "color-mix(in srgb, var(--lm-sage) 14%, transparent)",
            color: "var(--lm-sage)",
          }}
        >
          {state.success}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending}
          className="lm-pill justify-center py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
          {!pending && <Icon name="check" size={14} />}
        </button>

        <Link
          href="/update-password"
          className="text-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
          style={{ color: "var(--lm-muted)" }}
        >
          Change password
        </Link>
      </div>
    </form>
  );
}
