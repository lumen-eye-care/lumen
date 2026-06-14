import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="lm-display text-3xl" style={{ color: "var(--lm-text)" }}>
          Reset password
        </h1>
        <p className="text-sm" style={{ color: "var(--lm-muted)" }}>
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      </header>

      <ResetPasswordForm />

      <p className="text-center text-sm" style={{ color: "var(--lm-muted)" }}>
        <Link
          href="/sign-in"
          className="underline-offset-2 hover:underline"
          style={{ color: "var(--lm-warm)" }}
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
