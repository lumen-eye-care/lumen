# US-P2-02 — Lens builder (lens type + add-ons + prescription on the PDP)

**Status:** Specced, not started. **Tier:** P2 (Tier 3, stretch) — build at the **Week-5
checkpoint**, after P1 is complete. Do NOT pull forward ahead of P1.
**Depends on:** PDP + cart (US-P0-02/03 ✓), checkout re-pricing spine (US-P0-05 ✓),
**prescription upload + verify (US-P1-03 ✓ — this story consumes it)**.
**Related:** US-P1-04 WhatsApp prescription (alt Rx channel).

---

## Context

On the frame detail page, a customer configures the *lens* for the frame before adding to
bag: **lens type** (single-vision / reading included; varifocal etc. priced), **add-ons**
(blue-light filter, anti-reflective, light-reactive, polarised — each priced), and **their
prescription**. This is the screen in `docs/design/Frame Detail.html` / `frame-detail.jsx`
(the multi-step accordion: Frame colour → Lens type → Add-ons → Your prescription → total →
add to bag).

US-P1-03 already built the Rx **storage + verification** plumbing (private bucket,
`prescriptions` table, owner/admin RLS, status `pending|verified|rejected`, audit log,
`src/server/prescriptions.ts`). This story builds the **consumer**: the lens configurator +
the prescription-attach step + lens pricing in checkout.

## ⚠️ Inherited production gate (compliance, not code)

This story makes the prescription flow part of the **buy path**, so it inherits US-P1-03's
gate: the prescription feature stays behind `LUMEN_PRESCRIPTION_UPLOAD_ENABLED` and **off in
production** until Charity's **DPC registration** + a **named lens-fulfilment partner** clear.
The lens *builder* (types/add-ons/pricing) can be developed independently of that, but the
"attach your prescription" step can't go live in prod until the gate lifts.

---

## Prescription-attach flow (the "Your prescription" step)

Three entry states, all reusing US-P1-03's server module:

1. **Signed in, has Rx on file** → list their prescriptions (`listOwnPrescriptions`) with
   status pills; pick one to attach. A **verified** one is the happy path; a **pending** one
   is still selectable (see the fulfilment decision below).
2. **Signed in, no Rx** → upload inline (reuse `createPrescription`); the new (pending) row
   attaches immediately.
3. **Not signed in** → upload + sign up (or sign in); the Rx attaches to the new account, then
   they continue. (Mirror the "sign-in required for checkout" decision from `checkout-decisions`.)

### Decision — verify at FULFILMENT, not at cart (do not block the purchase)

**Do NOT make the customer wait for manual staff verification before they can add to bag /
check out.** Blocking the purchase on a human review step is a conversion killer. Instead:

- The customer attaches an Rx (verified **or** pending) and **checks out immediately**.
- Verification is a **fulfilment gate**: staff verify the attached Rx (the US-P1-03 admin
  queue) **before lenses are cut / the order is dispatched**, and contact the customer only if
  it's rejected/unclear. The order carries the `prescription_id` + its status.
- "Select an existing **verified** Rx" stays the fast path for repeat buyers.

So the stored Rx status drives the **order/fulfilment** state, not the cart gate.

---

## Scope

**In:**
1. Admin-managed **lens catalogue**: lens types + add-ons (name, description, price pesewa,
   badge like "Most popular"/"Recommended", active flag). New migration; RLS on; admin CRUD
   (extends US-P2-04 admin).
2. PDP **lens configurator** (client): lens type radio + add-on multi-select, running total,
   accordion steps from the design. Frame-only "add to bag" (US-P0-03) becomes lens-aware.
3. **"Your prescription" step** — the attach flow above (select existing / upload new /
   sign-up), reusing `src/server/prescriptions.ts`.
4. **Server-side lens pricing** — extend `src/lib/checkout-pricing.ts` `priceLines` so the
   line = frame + lens type + add-ons, re-priced from the DB at checkout (never trust the
   client cart — existing rule). Persist the lens/add-on/`prescription_id` selections on
   `order_items`.
5. Cart + order display of the chosen lens config; admin order detail shows it + the linked Rx.

**Out:** OCR / auto-reading Rx values (still no OCR in v1 — manual verify only); face-tracked
try-on (US-P2-01, separate); changing the "no structured Rx fields entered by the customer"
stance unless product decides otherwise.

---

## Data model (new migration)

- `lens_types` — `id, slug, name, description, price_ghs (pesewa, 0 = included), badge?,
  sort_order, is_active, timestamps`.
- `lens_addons` — same shape (`price_ghs` pesewa, `badge?`).
- `order_items` (extend) — `lens_type_id` (FK, nullable), `lens_addon_ids uuid[]` (or a join
  table), `prescription_id` (FK → `prescriptions`, nullable), and price snapshot columns so
  history survives catalogue edits. RLS unchanged (owner via order, admin all).
- Seed real lens types/add-ons (replace the design's hardcoded "+₵480 / +₵120" with DB rows).

## Pricing & validation

- Reuse the **pure** `priceLines` (`src/lib/checkout-pricing.ts`) + add lens/add-on
  contributions; unit-test. Re-price server-side in `repriceCart` (`src/server/checkout.ts`).
- Zod for the PDP selection payload (valid lens type, add-on ids, optional `prescription_id`
  the user actually owns).

## UI

- `shop/[slug]` — extend `frame-purchase-panel.tsx` (already the client island) with the
  accordion steps; keep the Server Component for data. Themed `--lm-*` (cinematic tier).
- "Your prescription" step renders the attach flow; reuse `PrescriptionStatusPill` +
  `OpenFileButton` from US-P1-03.

## Drop (invented data in the design mock — do not ship)

- **"4.9 · 248 reviews"** — no real review data/source in v1.
- **"Pay ₵283/month for 3 months with MTN MoMo · 0% interest"** — no installment product
  exists; don't imply one.
(Both already omitted from the live PDP per the 2026-06-09 PROGRESS note.)

## Security (CLAUDE.md 5/6/7/10)

- Inherits all US-P1-03 prescription rules (private bucket, signed URLs, audit log, consent,
  no PII in logs, prod flag gate).
- Lens pricing **re-priced from DB server-side** — never trust the client cart/total.
- New tables ship with RLS on (rule 6).

## Acceptance (high level)

1. Lens type + add-ons selectable on the PDP; total updates; server re-prices identically.
2. Signed-in customer can attach an existing Rx OR upload a new one; anon can upload + sign up.
3. Adding to bag with a **pending** Rx is allowed; the order records `prescription_id` + status.
4. Admin order detail shows the lens config + linked Rx; fulfilment can't dispatch an order
   whose Rx isn't `verified` (fulfilment gate, not cart gate).
5. typecheck/lint/test (+ pricing tests)/build green; prescription step stays prod-gated.

## Verification

Wire env + `db push` the lens-catalogue migration + seed; with the flag on: configure a frame,
attach a verified and a pending Rx, confirm server re-pricing matches the UI total, confirm the
order carries the lens + `prescription_id`, confirm the admin verify step gates fulfilment.
