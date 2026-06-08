import Link from "next/link";
import { requireAdmin } from "@/server/auth-guards";
import { signOut } from "@/app/(auth)/actions";
import { AdminNav } from "./_components/admin-nav";

/**
 * Admin shell (US-P1-07). `requireAdmin()` is the second of three authz layers
 * (proxy → this → RLS, CLAUDE.md rule 3): it runs on every admin render, role
 * read from app_metadata only. `force-dynamic` so the page never serves a cached
 * shell to the wrong user (CLAUDE.md caching gotcha).
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-lumen-cream md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-lumen-ink/10 bg-white/60 p-6 md:w-60 md:border-b-0 md:border-r">
        <Link href="/admin" className="flex flex-col">
          <span className="font-display text-lg text-lumen-ink">Lumen</span>
          <span className="text-xs uppercase tracking-[0.2em] text-lumen-sage">
            Admin
          </span>
        </Link>

        <AdminNav />

        <div className="mt-auto flex flex-col gap-2 border-t border-lumen-ink/10 pt-4">
          <span className="truncate text-xs text-lumen-ink/55" title={user.email}>
            {user.email}
          </span>
          <div className="flex gap-3 text-xs">
            <Link
              href="/"
              className="text-lumen-blue underline-offset-2 hover:underline"
            >
              View site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-lumen-ink/60 underline-offset-2 hover:text-lumen-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
