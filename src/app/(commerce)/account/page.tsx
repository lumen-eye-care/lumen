import type { Metadata } from "next";
import Link from "next/link";
import {
  getAccountProfile,
  getActiveOrders,
  getNextAppointment,
} from "@/server/account";
import {
  getOwnPrescriptionsSummary,
  prescriptionUploadEnabled,
} from "@/server/prescriptions";
import { SERVICE_LABELS, type AppointmentService } from "@/lib/appointment-schemas";
import { Icon, type IconName } from "@/components/atoms/icon";
import { OrderTracker } from "@/components/account/order-tracker";
import { orderStatusDisplay } from "@/lib/order-status";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const apptDateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const QUICK_ACTIONS: { href: string; label: string; icon: IconName }[] = [
  { href: "/book", label: "Book eye test", icon: "calendar" },
  { href: "/shop", label: "Shop frames", icon: "glasses" },
  { href: "/lens-guide", label: "Lens guide", icon: "eye" },
  { href: "/clinics", label: "Find a clinic", icon: "pin" },
];

function serviceLabel(service: string): string {
  return SERVICE_LABELS[service as AppointmentService] ?? "Appointment";
}

/**
 * Account dashboard (US-P1-06). Overview tiles + a live-order tracker + quick
 * actions, framed by the portal sidebar in the segment layout. Clinics/book
 * cinematic tier (editorial heading + scroll-reveal). Tiles only surface data
 * that exists in v1; Prescriptions is a "Soon" preview until US-P1-03.
 */
export default async function AccountDashboardPage() {
  const rxEnabled = prescriptionUploadEnabled();
  const [profile, active, nextAppt, rx] = await Promise.all([
    getAccountProfile(),
    getActiveOrders(),
    getNextAppointment(),
    rxEnabled ? getOwnPrescriptionsSummary() : Promise.resolve(null),
  ]);

  const firstName = profile.name?.split(" ")[0] ?? null;
  const live = active.live;

  return (
    <div className="flex flex-col gap-10">
      {/* ── Welcome ───────────────────────────────────────────────────────── */}
      <header className="lm-focus-in flex flex-col gap-1">
        <h1 className="lm-display text-3xl" style={{ color: "var(--lm-text)" }}>
          Welcome back
          {firstName ? (
            <>
              , <em className="italic" style={{ color: "var(--lm-blue)" }}>{firstName}</em>
            </>
          ) : null}
          .
        </h1>
        <p className="text-sm" style={{ color: "var(--lm-muted)" }}>
          Here&apos;s what&apos;s happening with your eye care and orders.
        </p>
      </header>

      {/* ── Stat tiles ────────────────────────────────────────────────────── */}
      <section data-animate data-stagger className="grid gap-3 sm:grid-cols-3">
        {/* Active orders */}
        <Link href="/account/orders" className="lm-card flex flex-col gap-1 p-5">
          <span className="lm-label">Active orders</span>
          <span className="lm-display text-4xl" style={{ color: "var(--lm-text)" }}>
            {active.count}
          </span>
          <span className="text-xs" style={{ color: "var(--lm-muted)" }}>
            {live
              ? `${live.payment_reference ?? `Order ${live.id.slice(0, 8)}`} · ${orderStatusDisplay(live.status).label}`
              : "No active orders"}
          </span>
        </Link>

        {/* Next appointment */}
        <Link href={nextAppt ? "/account/orders" : "/book"} className="lm-card flex flex-col gap-1 p-5">
          <span className="lm-label">Next appointment</span>
          <span className="lm-display text-[1.6rem] leading-tight" style={{ color: "var(--lm-text)" }}>
            {nextAppt?.preferred_date
              ? apptDateFmt.format(new Date(nextAppt.preferred_date))
              : nextAppt
                ? "Date TBC"
                : "—"}
          </span>
          <span className="text-xs" style={{ color: "var(--lm-muted)" }}>
            {nextAppt
              ? `${serviceLabel(nextAppt.service)} · ${nextAppt.clinic_name}`
              : "Book your next test"}
          </span>
        </Link>

        {/* Prescriptions — live count when the flag is on (US-P1-03), else a
            "Soon" preview. We show a COUNT, not Rx values: v1 is upload-only. */}
        {rxEnabled && rx ? (
          <Link href="/account/prescriptions" className="lm-card flex flex-col gap-1 p-5">
            <span className="lm-label">Prescriptions</span>
            <span className="lm-display text-4xl" style={{ color: "var(--lm-text)" }}>
              {rx.total}
            </span>
            <span className="text-xs" style={{ color: "var(--lm-muted)" }}>
              {rx.total === 0
                ? "Upload your Rx"
                : rx.pending > 0
                  ? `${rx.pending} awaiting review`
                  : `${rx.verified} verified`}
            </span>
          </Link>
        ) : (
          <div className="lm-card flex flex-col gap-1 p-5" aria-disabled="true">
            <span className="lm-label inline-flex items-center gap-2">
              Prescriptions
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: "var(--lm-tint)", color: "var(--lm-faint)" }}
              >
                Soon
              </span>
            </span>
            <span className="lm-display text-[1.6rem] leading-tight" style={{ color: "var(--lm-muted)" }}>
              Coming soon
            </span>
            <span className="text-xs" style={{ color: "var(--lm-muted)" }}>
              Upload your Rx after an eye test
            </span>
          </div>
        )}
      </section>

      {/* ── Live order tracker ────────────────────────────────────────────── */}
      {live && (
        <section data-animate className="lm-card flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="lm-label">
                Live order · {live.payment_reference ?? live.id.slice(0, 8)}
              </span>
              <span className="lm-display text-xl" style={{ color: "var(--lm-text)" }}>
                {orderStatusDisplay(live.status).label}
              </span>
            </div>
            <Link
              href={`/account/orders/${live.id}`}
              className="shrink-0 text-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--lm-warm)]"
              style={{ color: "var(--lm-warm)" }}
            >
              Track order →
            </Link>
          </div>
          <OrderTracker status={live.status} />
        </section>
      )}

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <section data-animate className="flex flex-col gap-4">
        <h2 className="lm-display text-2xl" style={{ color: "var(--lm-text)" }}>
          Quick actions
        </h2>
        <div data-stagger className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="lm-card flex flex-col gap-3 p-5 transition-colors"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[var(--r-md)]"
                style={{
                  background: "color-mix(in srgb, var(--lm-blue) 12%, transparent)",
                  color: "var(--lm-blue)",
                }}
              >
                <Icon name={a.icon} size={18} strokeWidth={1.5} />
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--lm-text)" }}>
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
