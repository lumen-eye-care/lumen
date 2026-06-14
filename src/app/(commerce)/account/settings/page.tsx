import type { Metadata } from "next";
import { signOut } from "@/app/(auth)/actions";
import { getAccountProfile } from "@/server/account";
import { AccountDetailsForm } from "../account-details-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * Account settings (US-P1-06). Editable profile (name/phone), password change,
 * sign out. Notification preferences are noted as upcoming — there's no prefs
 * store yet and SMS is out of scope for v1, so we don't ship fake toggles.
 */
export default async function AccountSettingsPage() {
  const profile = await getAccountProfile();

  return (
    <div className="flex flex-col gap-10">
      <header className="lm-focus-in flex flex-col gap-1">
        <h1 className="lm-display text-3xl" style={{ color: "var(--lm-text)" }}>
          Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--lm-muted)" }}>
          Manage your profile and account.
        </p>
      </header>

      {/* Profile */}
      <section data-animate className="flex flex-col gap-4">
        <h2 className="lm-display text-2xl" style={{ color: "var(--lm-text)" }}>
          Your details
        </h2>
        <div className="lm-card p-6">
          <AccountDetailsForm
            email={profile.email}
            name={profile.name}
            phone={profile.phone}
          />
        </div>
      </section>

      {/* Notifications — upcoming */}
      <section data-animate className="flex flex-col gap-4">
        <h2 className="lm-display text-2xl inline-flex items-center gap-2" style={{ color: "var(--lm-text)" }}>
          Notifications
        </h2>
        <div className="lm-card p-6">
          <p className="text-sm" style={{ color: "var(--lm-muted)" }}>
            Email order and appointment updates are on by default. Granular
            preferences are coming soon.
          </p>
        </div>
      </section>

      {/* Account */}
      <section data-animate className="flex flex-col gap-4">
        <h2 className="lm-display text-2xl" style={{ color: "var(--lm-text)" }}>
          Account
        </h2>
        <div className="lm-card flex items-center justify-between gap-4 p-6">
          <div className="flex flex-col">
            <span className="font-medium" style={{ color: "var(--lm-text)" }}>
              Sign out
            </span>
            <span className="text-sm" style={{ color: "var(--lm-muted)" }}>
              End your session on this device.
            </span>
          </div>
          <form action={signOut}>
            <button type="submit" className="lm-ghost">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
