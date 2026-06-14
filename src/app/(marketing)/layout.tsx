import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      {/* Offset the fixed header (var(--nav-h)). The home page is NOT in this
          group; its hero bleeds under the transparent header intentionally. */}
      <main style={{ paddingTop: "var(--nav-h)" }}>{children}</main>
      <SiteFooter />
    </>
  );
}
