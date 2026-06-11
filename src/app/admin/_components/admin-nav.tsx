"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/frames", label: "Frames" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/clinics", label: "Clinics" },
  { href: "/admin/appointments", label: "Appointments" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lumen-blue ${
              active
                ? "bg-lumen-blue text-lumen-cream"
                : "text-lumen-ink/70 hover:bg-lumen-ink/5 hover:text-lumen-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
