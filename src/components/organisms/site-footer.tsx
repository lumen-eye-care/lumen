/**
 * Global site footer — ported + typed from docs/design/shared.jsx Footer.
 * Async server component: clinic names + the location blurb come from the
 * DB (cookie-less cached read — static pages stay static; admin clinic
 * actions bust the "clinics" tag). Newsletter input is non-functional
 * markup for now — email capture wired in Sprint 1 email tasks.
 */

import Link from "next/link";
import { LogoMark } from "@/components/atoms/logo-mark";
import { Icon } from "@/components/atoms/icon";
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
    <footer className="mt-20 border-t border-lumen-ink/8 bg-lumen-ink text-lumen-cream/80">
      <div className="mx-auto max-w-[1280px] px-6 pb-8 pt-12">
        {/* Grid — 2×2 quadrant of link sections on mobile, 5-col on desktop.
            Brand + newsletter spans full width on top until the lg layout. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-5 lg:gap-10">
          {/* Brand col */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <LogoMark size={26} color="#fff" />
              <span className="font-display text-lg font-normal text-lumen-cream">
                Lumen
              </span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-lumen-cream/60">
              A modern eye clinic and considered eyewear house. {locationBlurb}
            </p>
            {/* Newsletter stub */}
            <div className="flex overflow-hidden rounded-md border border-lumen-cream/15">
              <input
                type="email"
                placeholder="Email for new arrivals"
                aria-label="Subscribe to email updates"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-lumen-cream placeholder:text-lumen-cream/40 focus:outline-none"
              />
              <button
                type="button"
                className="border-l border-lumen-cream/15 px-3 py-2 text-xs font-medium text-lumen-cream/80 transition-colors hover:bg-lumen-cream/8 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-lumen-cream"
              >
                Subscribe
              </button>
            </div>
          </div>

          {/* Eye care */}
          <FooterCol title="Eye care">
            <FooterLink href="/clinics">Book an eye test</FooterLink>
            <FooterLink href="/clinics">Home visit booking</FooterLink>
            <FooterLink href="/account/prescriptions">
              Upload prescription
            </FooterLink>
            <FooterLink href="/clinics">Contact lens fitting</FooterLink>
          </FooterCol>

          {/* Shop */}
          <FooterCol title="Shop">
            <FooterLink href="/shop">All frames</FooterLink>
            <FooterLink href="/shop?cat=sun">Sunglasses</FooterLink>
            <FooterLink href="/lens-guide">Lens guide</FooterLink>
            <FooterLink href="/try-on">Virtual try-on</FooterLink>
          </FooterCol>

          {/* Clinics — names come from the DB; generic link when none load */}
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
            <FooterLink href="/journal">Our story</FooterLink>
            <FooterLink href="/journal">Journal</FooterLink>
            <FooterLink href="/clinics">Contact</FooterLink>
          </FooterCol>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-lumen-cream/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-lumen-cream/40">
            © 2026 Lumen Eye Care Ltd · Licensed by AHPC Ghana · TIN
            C0012876452
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lumen-cream/40 transition-colors hover:text-lumen-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-cream"
            >
              <Icon name="insta" size={16} />
            </a>
            <a
              href="https://x.com"
              aria-label="X"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lumen-cream/40 transition-colors hover:text-lumen-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-cream"
            >
              <Icon name="xSocial" size={16} />
            </a>
            <a
              href="https://facebook.com"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lumen-cream/40 transition-colors hover:text-lumen-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-cream"
            >
              <Icon name="fb" size={16} />
            </a>
          </div>
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
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-lumen-cream/50">
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
        className="text-sm text-lumen-cream/60 transition-colors hover:text-lumen-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-cream"
      >
        {children}
      </Link>
    </li>
  );
}
