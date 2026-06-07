import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="font-display text-3xl text-lumen-ink">Reset password</h1>
        <p className="text-sm text-lumen-ink/70">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      </header>

      <ResetPasswordForm />

      <p className="text-center text-sm text-lumen-ink/70">
        <Link
          href="/sign-in"
          className="text-lumen-blue underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
