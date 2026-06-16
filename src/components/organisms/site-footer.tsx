/**
 * Global site footer — theme-aware via --lm-* vars (the darkest surface in
 * either palette). Async server component: clinic names + the location blurb
 * come from the DB (cookie-less cached read; admin clinic actions bust the
 * "clinics" tag). Newsletter input is non-functional markup for now.
 */

import Link from "next/link";
import { LogoLockup } from "@/components/atoms/logo-lockup";
import { getClinicFooterData } from "@/server/clinics";

export async function SiteFooter() {
  const { clinics, count, cities } = await getClinicFooterData();
  const cityList = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(cities);
  const locationBlurb =
    count > 0 && cities.length > 0
      ? `${count} ${count === 1 ? "location" : "locations"} across ${cityList}, plus home visits.`
      : "Clinics across Ghana, plus home visits.";

  return (
    <footer
      className="mt-24 border-t"
      style={{
        background: "var(--lm-deepest)",
        borderColor: "var(--lm-hair)",
        color: "var(--lm-muted)",
      }}
    >
      <div className="mx-auto max-w-[1280px] px-6 pb-8 pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-5 lg:gap-10">
          {/* Brand col */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4 flex" style={{ color: "var(--lm-text)" }}>
              <LogoLockup size={30} gap={5} color="currentColor" />
            </div>
            <p
              className="mb-6 text-sm leading-relaxed"
              style={{ color: "var(--lm-muted)" }}
            >
              A modern eye clinic and considered eyewear house. {locationBlurb}
            </p>
            {/* Newsletter stub */}
            <div
              className="flex overflow-hidden rounded-full border"
              style={{ borderColor: "var(--lm-hair)" }}
            >
              <input
                type="email"
                placeholder="Email for new arrivals"
                aria-label="Subscribe to email updates"
                className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
                style={{ color: "var(--lm-text)" }}
              />
              <button
                type="button"
                className="border-l px-4 py-2 text-xs font-medium transition-colors hover:bg-[color:var(--lm-tint)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--lm-warm)]"
                style={{
                  borderColor: "var(--lm-hair)",
                  color: "var(--lm-text)",
                }}
              >
                Subscribe
              </button>
            </div>
          </div>

          {/* Eye care */}
          <FooterCol title="Eye care">
            <FooterLink href="/book">Book an eye test</FooterLink>
            <FooterLink href="/book?service=home-visit">
              Home visit booking
            </FooterLink>
            <FooterLink href="/clinics">Contact lens fitting</FooterLink>
          </FooterCol>

          {/* Shop */}
          {/* TODO(US-P2-01): restore "Virtual try-on" → /try-on when it ships */}
          <FooterCol title="Shop">
            <FooterLink href="/shop">All frames</FooterLink>
            <FooterLink href="/shop?cat=sun">Sunglasses</FooterLink>
            <FooterLink href="/lens-guide">Lens guide</FooterLink>
          </FooterCol>

          {/* Clinics — names from the DB; generic link when none load */}
          <FooterCol title="Clinics">
            {clinics.length > 0 ? (
              clinics.map((clinic) => (
                <FooterLink key={clinic.slug} href={`/clinics#${clinic.slug}`}>
                  {clinic.name}
                </FooterLink>
              ))
            ) : (
              <FooterLink href="/clinics">Our clinics</FooterLink>
            )}
            <FooterLink href="/clinics">Home visits</FooterLink>
          </FooterCol>

          {/* Company */}
          <FooterCol title="Company">
            <FooterLink href="/clinics">Contact</FooterLink>
            <FooterLink href="/book">Book an appointment</FooterLink>
          </FooterCol>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex flex-col items-start justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center"
          style={{ borderColor: "var(--lm-hair)" }}
        >
          <p className="text-xs" style={{ color: "var(--lm-faint)" }}>
            © 2026 Lumen Eye Care Ltd · Licensed by AHPC Ghana · TIN
            C0012876452
          </p>
          {/* TODO(launch): social icons removed until Charity supplies the
              real profile URLs. */}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="mb-4 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--lm-faint)" }}
      >
        {title}
      </h3>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm transition-colors hover:text-[color:var(--lm-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
        style={{ color: "var(--lm-muted)" }}
      >
        {children}
      </Link>
    </li>
  );
}
