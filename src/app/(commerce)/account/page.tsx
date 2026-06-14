import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth-guards";
import { signOut } from "@/app/(auth)/actions";
import { Icon } from "@/components/atoms/icon";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * Minimal account index (US-P0-08). Deliberately not the full dashboard
 * (US-P1-06) — it exists so the "View my orders" link and the requireAdmin()
 * non-admin redirect target both resolve. Greeting + orders link + sign out.
 */
export default async function AccountPage() {
  const user = await requireUser();
  const name =
    (user.user_metadata?.name as string | undefined)?.trim() || user.email;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="lm-display text-3xl" style={{ color: "var(--lm-text)" }}>My account</h1>
        <p className="text-sm" style={{ color: "var(--lm-muted)" }}>Signed in as {name}</p>
      </header>

      <Link
        href="/account/orders"
        className="lm-card flex items-center justify-between gap-4 p-5 transition-colors"
      >
        <span className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: "color-mix(in srgb, var(--lm-blue) 12%, transparent)",
              color: "var(--lm-blue)",
            }}
          >
            <Icon name="cart" size={20} strokeWidth={1.5} />
          </span>
          <span className="flex flex-col">
            <span className="font-medium" style={{ color: "var(--lm-text)" }}>My orders</span>
            <span className="text-sm" style={{ color: "var(--lm-muted)" }}>
              Track and review what you&apos;ve placed
            </span>
          </span>
        </span>
        <Icon name="chev" size={20} style={{ color: "var(--lm-faint)" }} />
      </Link>

      <form action={signOut}>
        <button
          type="submit"
          className="text-sm font-medium underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
          style={{ color: "var(--lm-muted)" }}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
