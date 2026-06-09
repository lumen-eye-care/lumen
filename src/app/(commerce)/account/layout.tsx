import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";
import { requireUser } from "@/server/auth-guards";

/**
 * Account segment shell (US-P0-08). `requireUser()` is the first authz layer for
 * everything under /account — the proxy gates the path (src/proxy.ts) and RLS is
 * the last line, but this runs on the server for the whole segment. Reading auth
 * cookies makes the segment dynamic; per-page `force-dynamic` keeps it explicit.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 py-12">{children}</main>
      <SiteFooter />
    </>
  );
}
