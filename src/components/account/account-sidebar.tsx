"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/atoms/icon";
import { getInitials } from "@/lib/initials";

/**
 * Account portal sidebar (US-P1-06). User card + tabbed nav. Built (linked) tabs
 * highlight on the active route; not-yet-built tabs render disabled with a "Soon"
 * tag so the portal shows its full shape without broken links (the prior audit
 * removed dead links). Prescriptions flips live with US-P1-03.
 *
 * Responsive: vertical rail on md+, a horizontal scroll strip on mobile.
 */

type NavItem = {
  href?: string;
  label: string;
  icon: IconName;
  badge?: number;
  soon?: boolean;
  /** Exact-match active (for the dashboard index). */
  exact?: boolean;
};

type AccountSidebarProps = {
  name: string;
  email: string;
  activeOrders: number;
  /** US-P1-03 flag: when on, Prescriptions becomes a live link, not "Soon". */
  prescriptionsEnabled?: boolean;
};

export function AccountSidebar({
  name,
  email,
  activeOrders,
  prescriptionsEnabled = false,
}: AccountSidebarProps) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/account", label: "Dashboard", icon: "home", exact: true },
    {
      href: "/account/orders",
      label: "Orders",
      icon: "cart",
      badge: activeOrders > 0 ? activeOrders : undefined,
    },
    { href: "/account/appointments", label: "Appointments", icon: "calendar" },
    prescriptionsEnabled
      ? { href: "/account/prescriptions", label: "Prescriptions", icon: "eye" }
      : { label: "Prescriptions", icon: "eye", soon: true },
    { label: "Saved frames", icon: "heart", soon: true },
    { label: "Addresses", icon: "pin", soon: true },
    { label: "Payment methods", icon: "phone", soon: true },
    { href: "/account/settings", label: "Settings", icon: "user" },
  ];

  const isActive = (item: NavItem) =>
    item.href !== undefined &&
    (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <aside className="md:w-60 md:shrink-0">
      {/* User card */}
      <div className="lm-card mb-4 flex items-center gap-3 p-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={{
            background: "color-mix(in srgb, var(--lm-blue) 16%, transparent)",
            color: "var(--lm-blue)",
          }}
        >
          {getInitials(name, email)}
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium" style={{ color: "var(--lm-text)" }}>
            {name || "Your account"}
          </div>
          <div className="truncate text-xs" style={{ color: "var(--lm-muted)" }}>
            {email}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        aria-label="Account"
        className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0"
      >
        {items.map((item) => {
          const active = isActive(item);
          const inner = (
            <>
              <span className="flex items-center gap-2.5">
                <Icon name={item.icon} size={16} strokeWidth={1.5} />
                <span className="whitespace-nowrap">{item.label}</span>
              </span>
              {item.badge !== undefined && (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold"
                  style={{ background: "var(--lm-warm)", color: "#1a0f0a" }}
                >
                  {item.badge}
                </span>
              )}
              {item.soon && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ background: "var(--lm-tint)", color: "var(--lm-faint)" }}
                >
                  Soon
                </span>
              )}
            </>
          );

          const base =
            "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]";

          if (item.soon || !item.href) {
            return (
              <span
                key={item.label}
                aria-disabled="true"
                className={`${base} cursor-default`}
                style={{ color: "var(--lm-faint)" }}
              >
                {inner}
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={base}
              style={{
                color: active ? "var(--lm-blue)" : "var(--lm-muted)",
                background: active
                  ? "color-mix(in srgb, var(--lm-blue) 10%, transparent)"
                  : "transparent",
                fontWeight: active ? 600 : 400,
              }}
            >
              {inner}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
