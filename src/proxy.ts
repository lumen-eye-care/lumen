import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js Proxy (formerly "middleware" — renamed in Next 16). Runs at the edge
 * in front of the app: refreshes the Supabase session and sets security headers.
 *
 * Content Security Policy (CLAUDE.md security rule 9). Tuned for Paystack's
 * inline script + hosted checkout, Google Fonts, Supabase, and Vercel.
 */
// React/Turbopack use eval() for dev-mode debugging only; never in production.
const devScriptSrc = process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devScriptSrc} https://js.paystack.co`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co https://api.paystack.co",
  "frame-src https://checkout.paystack.com",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", CSP);
  return response;
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Before Supabase env is wired (Sprint 0 cloud setup), still apply the CSP so
  // the app boots and renders without auth.
  if (!supabaseUrl || !supabasePublishableKey) {
    return withSecurityHeaders(NextResponse.next({ request }));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session (recommended @supabase/ssr step). This is NOT an
  // authorization decision — handlers (requireAdmin) + Postgres RLS are the
  // real gates. CVE-2025-29927 is patched in Next 16, but the principle stands.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Fast denial: unauthenticated hits on protected areas.
  if (!user && (pathname.startsWith("/account") || pathname.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", pathname);
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  // Fast admin denial (defense in depth only). Role from app_metadata (trusted).
  if (pathname.startsWith("/admin")) {
    const role = (user?.app_metadata?.role as string | undefined) ?? "customer";
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      return withSecurityHeaders(NextResponse.redirect(url));
    }
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
