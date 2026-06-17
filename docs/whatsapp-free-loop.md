# WhatsApp appointment loop — the zero-cost design

**Status:** live (no external onboarding required).
**Goal:** WhatsApp as the booking follow-up channel for customers and the clinic
rep, at **zero per-message cost** — no Meta Cloud API, no billable templates.

## Why this shape

Meta's WhatsApp pricing (per-message model, effective 1 Jul 2025) makes exactly one
thing billable for our use case: a **business-initiated template message to someone
who has not messaged us first** (i.e. a proactive automated push to the rep).
Everything else is free:

- **`wa.me` click-to-chat deep links** — no API, no onboarding, no cost.
- **The 24-hour customer-service window** — opens when a *customer* messages the
  business first; inside it the business replies free-form, free.

So the loop is **customer-initiated**, which keeps it entirely free.

## How each party is served (all free)

- **Customer** — after booking, the success screen and the confirmation email both
  offer a "Message us on WhatsApp" link (`wa.me`), prefilled with their full booking
  summary. Tapping it opens the free 24h window on their preferred channel.
- **Clinic rep** — alerted two ways, no cost:
  1. **Automated email** to `APPOINTMENTS_NOTIFY_EMAIL` for *every* booking
     (guaranteed fallback), already carrying one-tap `wa.me`/`tel:` links to the
     customer. Set this env var to the rep/ops inbox.
  2. The customer's **click-to-chat** lands in the staffed **WhatsApp Business App**
     inbox with the full booking summary — so for tappers the rep is alerted on
     WhatsApp with complete context.
- **Admin (Charity)** — manages the queue at `/admin/appointments` as before.

## Operational requirement (Charity)

Run the **free WhatsApp Business App** on the clinic line whose number is
`LUMEN_WHATSAPP_E164` (`src/lib/contact.ts`, currently `+233245628432`) so
customer click-to-chats are answered. No API keys, no per-message billing.

## Future option (not built, not blocking)

A genuinely-automated business-initiated WhatsApp push to the rep would require the
**Meta Cloud API** + an approved **Utility template** (billable, ~GHS 0.10/msg) and
Charity's Meta Business onboarding. It would slot in behind the same `waMeUrl` /
`contact.ts` seam as a best-effort, env-gated channel (Sentry/Upstash pattern) — but
it is an upgrade, not a dependency. If proactive push is ever wanted for free,
**Telegram Bot API** is the no-cost alternative (different app, not WhatsApp).

## Code map

- `src/lib/contact.ts` — `LUMEN_WHATSAPP_E164` + `buildBookingWhatsAppText` /
  `bookingWhatsAppUrl` (pure, tested in `contact.test.ts`).
- `src/lib/wa-link.ts` — `waMeUrl()` deep-link helper.
- `src/app/(marketing)/book/book-form.tsx` — success-screen CTA.
- `src/server/appointments.ts` — confirmation-email link + existing rep email.
