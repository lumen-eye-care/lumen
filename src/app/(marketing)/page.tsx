/**
 * This page file satisfies the Next.js page contract for the (marketing)
 * route group at `/`. In practice it is NEVER reached — `app/page.tsx`
 * (the outer root page) takes precedence for `/`.
 *
 * The (marketing) group exists only to provide its layout (SiteHeader +
 * SiteFooter) to nested routes: /shop, /clinics, /lens-guide, etc.
 * The home page lives in `app/page.tsx` and includes the header/footer
 * explicitly to avoid the duplicate-route conflict.
 *
 * We must keep a valid default export here so Next.js build validation passes.
 */
import { redirect } from "next/navigation";

export default function MarketingGroupRootFallback() {
  // Should never execute — outer app/page.tsx handles `/`.
  redirect("/shop");
}
