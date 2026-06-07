import type { Metadata } from "next";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Set a new password" };

/**
 * Reached via the recovery link → /auth/confirm (type=recovery) sets a recovery
 * session, then redirects here. updateUser() in the action relies on that session.
 */
export default function UpdatePasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="font-display text-3xl text-lumen-ink">
          Set a new password
        </h1>
        <p className="text-sm text-lumen-ink/70">
          Choose a new password for your account.
        </p>
      </header>

      <UpdatePasswordForm />
    </div>
  );
}
