import Link from "next/link";
import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";
import { requireUser } from "@/server/auth-guards";
import { getAccountProfile, getActiveOrders } from "@/server/account";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { Icon } from "@/components/atoms/icon";

/**
 * Account portal shell (US-P1-06). `requireUser()` is the first authz layer for
 * everything under /account — the proxy gates the path (src/proxy.ts) and RLS is
 * the last line. The sidebar (user card + tabbed nav) frames every account page;
 * reading auth + profile data makes the segment dynamic.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const [profile, active] = await Promise.all([
    getAccountProfile(),
    getActiveOrders(),
  ]);

  return (
    <>
      <SiteHeader />
      <main
        className="mx-auto w-full max-w-[1100px] px-6 pb-16"
        style={{ paddingTop: "calc(var(--nav-h) + 2rem)" }}
      >
        {/* Breadcrumb */}
        <nav
          className="mb-6 flex items-center gap-1.5 text-xs"
          style={{ color: "var(--lm-faint)" }}
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="transition-colors hover:text-[color:var(--lm-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
          >
            Home
          </Link>
          <Icon name="chev" size={10} className="-rotate-90" />
          <span style={{ color: "var(--lm-muted)" }}>My account</span>
        </nav>

        <div className="md:flex md:gap-10">
          <AccountSidebar
            name={profile.name ?? ""}
            email={profile.email}
            activeOrders={active.count}
          />
          <div className="min-w-0 flex-1 pt-2 md:pt-0">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
