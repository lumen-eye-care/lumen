# PROGRESS.md — Lumen v1 Build Log

**How to use:** Keep this to ~one screen (current state + next steps only). Git history preserves detail; trim stale entries here. Update at merge-to-main points, not on every feature branch (avoids conflicts). Newest entries at top.

---

## 2026-06-17 — Zero-cost WhatsApp appointment loop (build-complete)

**Status: shipped on branch.** WhatsApp is now the booking follow-up channel for customer
and rep at **zero per-message cost** — no Meta Cloud API, no billable templates, no
onboarding. Replaces the deferred "automated WhatsApp-to-rep (Cloud API)" Phase 2 idea with a
**customer-initiated** design (the only billable piece was a business-initiated push). No
migration, no new deps, no env vars, no CSP change. See `docs/whatsapp-free-loop.md`.

**What landed:**
- **`src/lib/contact.ts`** (new, +6 tests) — `LUMEN_WHATSAPP_E164` single source of truth
  (was hardcoded `233245628432` in the PDP) + pure `buildBookingWhatsAppText`/
  `bookingWhatsAppUrl` (full booking summary so the customer's chat doubles as the rep's
  WhatsApp alert with context). PDP `frame-purchase-panel.tsx` now uses `waMeUrl(LUMEN_…)`.
- **Booking success screen** `book-form.tsx` — "Message us on WhatsApp" `lm-ghost` CTA,
  prefilled from booking context; `BookFormState.success` extended with name/clinic/service/
  date. Copy now points to both email + WhatsApp.
- **Confirmation email** `appointments.ts` — `customerText` gains a free `wa.me` line (second
  entry point to open the 24h window). Rep email/`wa.me`+`tel:` links unchanged.
- **Rep alerting stays free:** automated email per booking (already built) + WhatsApp via the
  customer's tap. No automated business-initiated push. Cloud-API push recorded as an optional,
  billable future upgrade behind the same seam; Telegram noted as a free-push alternative.

**Open caveat:** depends on Charity running the **WhatsApp Business App** on the
`LUMEN_WHATSAPP_E164` line so click-to-chats are answered; `APPOINTMENTS_NOTIFY_EMAIL` must be
set for the rep email. WhatsApp links work the moment they're tapped (no inbox/key needed to send).

**Next steps:** Cloud-API WhatsApp push remains optional, not blocking. Paystack webhook is live and resolved.

---

## 2026-06-17 — US-P1-01 customer Appointments tab + US-P1-05 order tracking (build-complete)

**Status: shipped on branch.** Customers can now see their appointment requests in-account with
live status, the appointment notification loop is closed end-to-end, and the order tracker now
renders on the order detail page (trimmed to honest stages). No migration, no new deps, no flag.

**What landed:**
- **Appointments tab** `account/appointments/` — `listOwnAppointments()` in `src/server/appointments.ts`
  (RLS client + **explicit `.eq("user_id")`** owner filter, mirrors `listOwnPrescriptions`; the
  `appointments admin all` policy would otherwise leak every row to an admin on their own page —
  [[rls-admin-all-policy-needs-explicit-owner-filter]]). New page lists service/clinic/preferred
  date/notes + an `AppointmentStatusPill` (`components/account/`, requested/confirmed/completed/
  cancelled tones); honest empty state → `/book`. Sidebar tab flipped from "Soon" to a live link;
  dashboard "next appointment" tile now links to the page.
- **Notification loop closed** (clinic reps are NOT app users — they act from the notification):
  the rep/ops booking email (`sendAppointmentEmails` `adminText`) now carries a **wa.me click-to-chat
  + `tel:` link** built from the customer's E.164 phone (reuses `waMeUrl`); and admin status changes
  (`admin/appointments/actions.ts`) now fire a new **`sendAppointmentStatusEmail`** to the customer
  (per-status copy for confirmed/cancelled/completed) — best-effort, no-throw, never blocks the
  status write. **Automated WhatsApp-to-rep via the Cloud API is deferred to a Phase 2 story**
  (needs Charity's Meta Business onboarding, approved Utility templates, ~GHS 0.10/msg, CSP widen).
- **Order tracker (US-P1-05)** — dropped the fictional `delivered` stage: only `placed`/`confirmed`/
  `shipped` have real drivers (nothing sets `delivered` — no admin action, no courier integration in
  v1). `src/lib/order-tracker.ts` reduced to 3 stages (defensive cap for stray `delivered`); tests
  updated; `OrderTracker` grid made dynamic; tracker now rendered on `account/orders/[id]` (live
  orders only), not just the dashboard.

**Verified (2026-06-17):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · **220/220 tests** ✓ · `pnpm build` ✓
(new route `/account/appointments`). **Live against staging** (this fresh worktree had no `.env.local`
— copied staging's from main, gitignored): seed customer → tab live, empty state, booked a test
appointment → listed correctly (Eye test · East Legon · Fri 10 Jul · "Requested"); order detail
showed the **3-stage tracker** (a Confirmed/paid order lights placed+confirmed, leaves shipped un-lit).
**Owner-scoping confirmed:** seed admin's own `/account/appointments` showed only their own row and did
**not** leak the customer's appointment. **Status-change path:** marking "confirmed" persisted; both
`sendAppointmentStatusEmail` and the rep email ran and failed **non-fatally** on the absent
`RESEND_API_KEY` (logged, didn't block) — exactly as designed.

**Open caveats:** all appointment email is **inert until Resend's key + domain are live** (existing
caveat) + `APPOINTMENTS_NOTIFY_EMAIL` must be set to the rep/Charity inbox for the booking alert. A
labeled test appointment ("Verification test booking — please ignore", now `confirmed`) was left in
staging (no in-app delete for appointments).

**Next steps:** (1) Resume the deferred **Paystack webhook E2E** (orders still stuck `pending`;
needs a tunnel to a `sk_test` env). (2) Phase 2 story: automated WhatsApp-to-rep (Cloud API).

---

## 2026-06-15 — US-P1-03 prescription upload (flag-gated, build-complete)

**Status: code-complete behind `LUMEN_PRESCRIPTION_UPLOAD_ENABLED` (default off).** Customers can upload an existing Rx (photo/PDF) to their account; staff verify it manually. Upload-only — no OCR, no structured Rx fields, no lens pricing (those stay US-P2-02). Built on existing infra (private `prescriptions` bucket + `prescription_access_log` + the flag).

**`BLOCKED:` production rollout** — flipping the flag in prod processes health data and is gated on Charity's **DPC registration** + a **named lens-fulfilment partner** (compliance, not code). Stays off in prod until both clear.

**What landed (migration `20260615000001_prescriptions.sql`):**
- **`prescriptions` table** — RLS on, `set_updated_at` trigger, `consent_at` NOT NULL (no row without consent), status `pending|verified|rejected`. Policies: owner read, owner insert (`with check … and consent_at is not null`), admin-all; **no owner UPDATE** (status is admin-only — no self-verify). FK `prescription_access_log.prescription_id → prescriptions` added (was loose). `src/db/types.ts` hand-updated (worktree not linked).
- **Schema** `src/lib/prescription-schemas.ts` (+18 tests) — file mime/size guard (5 MB, tighter than the 10 MB bucket), `validatePrescriptionFile`, optional practitioner/issued-on (no future)/notes, `consent: literal(true)`, `isStaleIssueDate` (>12 mo → UI warns, never blocks).
- **Server** `src/server/prescriptions.ts` (`server-only`) — `createPrescription` (RLS-client upload to `<user_id>/<uuid>.<ext>` → metadata insert → **secret-key** audit `upload`; rolls back orphaned object on insert failure), `listOwnPrescriptions` (explicit owner `.eq`), `getPrescriptionSignedUrl` (RLS read → secret-key 1-hour signed URL → audit `read`), admin `listPrescriptions`/`getPrescription`/`setPrescriptionStatus`. Flag + env guarded.
- **Customer UI** `account/prescriptions/` — flag-gated (`notFound()` when off); consent checkbox **gates** the file input + submit (server re-checks); list with status pill + "View" + honest empty state → `/book`. "View"/admin "Open file" open the signed URL in a **new tab** via a shared client `OpenFileButton` (`components/prescriptions/`) that calls a URL-returning server action + `window.open(_blank, noopener)` — the page stays put; URL still server-minted + audit-logged. Sidebar Prescriptions tab flips from "Soon" to a live link when the flag is on (`account/layout.tsx` reads the flag); the **account dashboard Prescriptions tile** likewise flips from the "Soon" placeholder to a live **count** tile (total + "N awaiting review"/"N verified", links to the page) via `getOwnPrescriptionsSummary` — a count, not Rx values (v1 is upload-only).
- **Admin UI** `admin/prescriptions/` — queue + detail (open file via logged 1-hour URL, verify/reject with a customer-visible note). `requireAdmin()` in every page/action. Nav item added; admin `StatusBadge` gained verified/rejected tones.

**Verified (2026-06-15):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · **220/220 tests** ✓ (+18) · `pnpm build` ✓ (new routes `/account/prescriptions`, `/admin/prescriptions`, `/admin/prescriptions/[id]`).

**Migration `db push`ed to Lumen-staging (2026-06-15)** + `src/db/types.ts` regenerated from the live schema (typecheck still green → hand-written types matched). **Live security model verified against staging** with two real test users (throwaway script, cleaned up): owner insert needs consent (no-consent → `42501`); can't insert a row for another user (`42501`); owner uploads only into own `<user_id>/` folder; another user sees **0** of A's rows and **cannot** upload into A's folder (`new row violates row-level security policy`); **owner cannot self-verify** status (stays `pending`); service-key mints a working 1-hour signed URL; audit-log write via service key; admin sets `verified`. Flag-on routing also confirmed live (both routes 200 vs 404 when off).

**Full browser click-through done (2026-06-15)** against staging via the seed customer (`koko.etornam@gmail.com`) + seed admin: consent gate disables file/submit until ticked → enabled on tick; customer upload of a PDF → success card + listed "Awaiting review"; row landed under `<user_id>/` with practitioner/notes/`consent_at` saved; **"View" minted a signed URL and wrote a `read` audit row** (upload+read both logged); admin queue showed the row (customer join working) → detail (file size/notes/DPA banner) → **Mark verified with a review note persisted** (`status=verified`, note saved). Test data cleaned up afterwards (0 rows left).

**Next steps:** (1) Resume the deferred **Paystack webhook E2E** (orders still stuck `pending`). (2) US-P1-05 order tracking / customer Appointments tab.

---

## 2026-06-14 — US-P1-06 account dashboard → sidebar portal · header signed-in avatar · orders owner-scoping fix · US-P1-03 story

**Status: US-P1-06 shipped.** `/account` went from a minimal index to the full sidebar portal from `docs/design/account.jsx`, themed into `--lm-*`. PR #31.

**What landed (no migration, no new deps):**
- **Portal layout** `account/layout.tsx` + `components/account/account-sidebar.tsx` — user card + tabbed nav (active highlight, live **Orders badge**). Built tabs link (Dashboard/Orders/Settings); not-yet-built tabs (Appointments, Prescriptions, Saved frames, Addresses, Payment methods) render disabled **"Soon"** (no broken links — prior audit rule). Responsive: vertical rail / mobile horizontal scroll strip.
- **Dashboard** `account/page.tsx` — welcome + 3 stat tiles (Active orders, Next appointment from real `appointments`, Prescriptions "Soon" preview), **live-order tracker** (`components/account/order-tracker.tsx` over pure `src/lib/order-tracker.ts`, +8 tests — real statuses only: placed→confirmed→shipped→delivered, no fictional "lenses cut"), quick actions. Clinics/book cinematic tier.
- **Settings tab** `account/settings/page.tsx` — editable name/phone (`src/lib/account-schemas.ts` +5 tests, reuses `phoneSchema`/E.164 via `updateProfile` action), read-only email, change-password link, sign out. Notifications noted "coming soon" (no fake toggles; no SMS in v1).
- **Header signed-in avatar** `site-header.tsx` — initials avatar when signed in vs guest icon, via the `CartAuthSync` browser-auth pattern (env-guarded, read-only); shared `src/lib/initials.ts` (also used by the sidebar card).
- **Data layer** `src/server/account.ts` — `getAccountProfile`/`getActiveOrders`/`getNextAppointment`, all **owner-scoped explicitly**.
- **US-P1-03 story** `docs/stories/US-P1-03-prescription-upload.md` — spec for next session (infra exists: private bucket + access-log table + flag). Build can proceed; **prod flag-flip still gated on Charity's DPC registration** (health data).

**Bug fixed (correctness/privacy):** the `orders`/`users` tables carry an `admin all` RLS policy, so reads relying on RLS alone surfaced **every customer's orders/profile** to an admin on their *own* account pages (and broke `maybeSingle()`). All account reads + `/account/orders` list + `[id]` detail now filter `user_id`/`id` explicitly. RLS still enforces; admins see all only in `/admin`. (Memory: `rls-admin-all-policy-needs-explicit-owner-filter`.)

**Verified (2026-06-14):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · **202/202 tests** ✓ (+13) · `pnpm build` ✓. Preview-verified signed in vs staging: portal in light/dark + mobile; profile save persists with `0XX→+233` normalization; header avatar shows site-wide; orders correctly owner-scoped (admin sees own 2, not all).

**Open caveats:**
- **Paystack webhook not wired to any running env** → all initiated payments stay `pending` ("Awaiting payment"); nothing flips to `paid`/"Confirmed" until the dashboard webhook points at `…/api/paystack/webhook` with a mode-matched secret key. Prod endpoint `https://www.lumeneye.org/api/paystack/webhook` verified live + signature-gated (401 on bad sig). Test-mode E2E needs a tunnel to a `sk_test` env.
- Blocked account tabs (Prescriptions/Saved/Addresses/Payments) are "Soon" placeholders; Appointments customer view also deferred.

**Next steps:** (1) Wire Paystack webhook per env + run a payment E2E. (2) US-P1-03 prescription upload (story ready). (3) US-P1-05 order tracking deepening (tracker foundation now exists) · customer Appointments tab (data exists from US-P1-01).

---

## 2026-06-14 — Redesign completion pass: full per-page dark-mode conversion · real lens quiz (US-P1-02) · header overflow fix

**Status: dark mode now complete across every customer-facing surface.** Closes the "still light theme persists at some places" gap from the Phase 1+2 entry below — all remaining `lumen-*` hardcoded tokens outside `/admin` are converted to `--lm-*` semantic vars, so light↔dark is correct site-wide (admin intentionally excluded).

**What landed (no migration, no new deps):**
- **Per-page dark-mode conversion** — clinics (`page` hero + `ClinicCard` + `HomeVisitBanner`), auth (`layout`, `_components/auth-ui`, sign-in/sign-up/reset/update-password pages + links), cart (`cart-view`, `cart-line-item`, `cart-drawer` slide-over), checkout (`checkout-form`, `callback-view`, `success`), account (`page`, `orders`, `orders/[id]`), PDP (`frame-purchase-panel`, `shop/[slug]` breadcrumb), shared atoms (`empty-state`, `toast`, `order-status-pill`, `button`), `error`/`not-found`, `clinics/loading`. All now use `--lm-*` + `lm-pill`/`lm-ghost`/`lm-card`; verified in dark mode (sign-in card `#122438` on navy body, clinics cards themed, no white-on-navy).
- **Real lens quiz (US-P1-02)** `src/lib/lens-quiz.ts` (+13 tests) — deterministic **rule-based recommendation engine**: 5 questions (primary use, screen time, age band, outdoor exposure, current correction) → lens type (single-vision / reading / varifocal) + ranked add-ons (anti-reflective, blue-light, light-reactive, polarised) **each with its reasoning string**, auditable by an optometrist. `src/app/(marketing)/lens-guide/` hosts the interactive 5-step UI (progress bar, back/restart, honest disclaimer, CTAs to `/book` + `/shop`). Home `LensQuizCta` "Take the lens quiz" now points at the live tool, not a placeholder.
- **Header "Book eye test" overflow fix** — root cause: `.lm-pill` is **unlayered** CSS, so it always beats Tailwind v4's layered `.hidden` utility → `hidden md:inline-flex` never hid the pill and it ran off the right edge on mobile (measured 431px on a 376px screen). Fixed by moving the responsive show/hide onto a plain `<div className="hidden md:block">` wrapper (no `lm-pill`), so `.hidden` applies. Verified in-DOM: hidden ≤767px, visible ≥768px, no overflow either way. **General caveat recorded:** any `lm-*` element hidden via a `hidden`/`md:` utility hits the same layering trap — the proper root fix (wrap `lm-*` component classes in `@layer components`) is deferred.

**Verified (2026-06-14):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · **185/185 tests** ✓ (+13 quiz) · `pnpm build` ✓ · dark-mode spot-checks in the preview (sign-in, clinics) + header breakpoint check in-DOM.

**Next steps:** (1) P1 continues — US-P1-06 account dashboard (current `/account` is the minimal index), US-P1-05 order tracking. (2) Optional root fix: move `lm-*` component classes into `@layer components` so utilities can override them. (3) Phase 3 productionisation (real per-frame `.glb` + `frames.model_url`).

---

## 2026-06-14 — Immersive redesign Phase 1+2: dark/light theme system · promoted home · cinematic shop · OGL hero shader

**Status: redesign foundation shipped.** Whole storefront now runs on a themeable "cinematic" design language (light cream / dark navy) with a global toggle. Home + shop + shared chrome redesigned; commerce/auth/clinics/book inherit the new header/footer + theme vars and get a per-page polish pass later (agreed phasing).

**What landed (no migration; deps `ogl@1`, `detect-gpu@5`):**
- **Theme system** `src/styles/globals.css` — `--lm-*` semantic tokens (base/surface/deep/raise/deepest, text/muted/faint/hair/tint, warm/sage/blue, glass/shadow + motion-reactive scan/glow/grain opacities). Light is default; `[data-theme="dark"]` overrides to navy. Motion primitives ported from the old preview.css (`lm-focus-in`, `lm-rise`, `lm-float`, `lm-scan`, `lm-glow`, `lm-grain`, `lm-pill/ghost/card`, scroll-reveal `[data-animate]/[data-stagger]`), all reduced-motion-safe.
- **Theme components** `src/components/theme/` — `ThemeProvider` (reads theme via **useSyncExternalStore off the `<html>` data-theme attribute** — no setState-in-effect, lint-clean), `THEME_SCRIPT` inline pre-paint resolver (no FOUC; `suppressHydrationWarning` on `<html>`), `ThemeToggle` (sun/moon, in header), `ScrollReveal` (global IntersectionObserver). **ScrollReveal hardened**: synchronous setup (not rAF-gated) + a `getBoundingClientRect` layout pass on mount and on scroll, so content at/above the fold can never stay stuck at `opacity:0` even if IO/rAF is throttled (verified: 10/10 sections reveal with IO dead in the non-compositing preview).
- **Header/Footer** `site-header.tsx` rebuilt: `fixed`, **transparent over the home hero → frosted glass (`--lm-base-glass` + blur) on scroll/inner pages**, theme toggle integrated, nav = Shop glasses · Eye tests (`/book`) · Clinics (`/clinics`), CTA → `/book` (was wrongly `/clinics`). `site-footer.tsx` now theme-aware via `--lm-*` (darkest surface in either palette). Inner-page mains got `padding-top: var(--nav-h)` (header no longer reserves flow space); home hero bleeds full-bleed under it (fixes the old "hero above header" overlap).
- **Home promoted** `app/page.tsx` is now the full immersive landing (the `(preview)/home` route + `components/preview/*` + `preview.css` were **retired**). Sections: `ImmersiveHero` (gradient field + scan + glow + floating frame, placement bug fixed), `Manifesto`, **`TwoPaths`** (new — replaces the 6-card services grid with an editorial fork: "new → eye test `/book`" vs "have a prescription → frames `/shop`", then a Test→Choose→Fit step strip; try-on/Rx-upload deliberately live *inside* the shopping flow, not as competing cards), `FramesReel` (live catalogue, FrameSVG fallback), **`LensQuizCta`** (new — honest CTA to `/book` for lens guidance; **no fake quiz widget/hardcoded results** — the interactive quiz is US-P1-02, `TODO` to repoint), `ClinicsCta`.
- **Shop themed** `shop/page.tsx` hero (gradient + grain + editorial heading) + empty/contacts states, `FrameCard` (→ `lm-card`), and all chrome (`ShopTabs`, `ShopToolbar`, `SortSelect`, `ShopFilters`, `FilterPanel`, `FilterGroup`, `MobileFilterBar`, `loading.tsx`) converted to `--lm-*`.
- **OGL hero shader (Phase 2)** `components/home/hero-frame.tsx` is a **detect-gpu tier gate**: default/TIER_0–1 (the Tecno/Infinix baseline) → CSS-tilt `HeroFrameImage` (GPU compositor, no WebGL bytes); **TIER_2+ desktop only** → lazy-loaded (`next/dynamic`) `HeroFrameShader` (OGL: 1 triangle, 1 texture, cursor-driven chromatic aberration + slow wave, no post-processing, DPR-capped, disposes GL on unmount, `onError`→CSS). Coarse-pointer / reduced-motion / save-data skip the benchmark entirely.

**Decisions (technical-lead call, recorded):** rejected full Three.js / Babylon / R3F for the Ghana device profile (563 KB+ parse cost on TIER_0/1). **OGL (6 KB) for the one hero effect, GPU-gated.** See memory `webgl-strategy-and-phasing`.

**Phase 3 POC shipped (same day, flag-gated `NEXT_PUBLIC_DEMO_3D_ENABLED`, default OFF):** Google **`<model-viewer>`** 3D + AR preview on the PDP. `dep @google/model-viewer` **self-hosted** (no CDN → no CSP widening; script/connect/img all stay on `'self'`, rule 9). `src/components/pdp/model-viewer.tsx` (lazy `import()` of the runtime — code-split, loads only when the visitor taps "View in 3D") + `frame-3d-section.tsx` (toggle section) + `src/lib/frame-3d.ts` (flag gate). Mounted on `shop/[slug]` after the purchase panel, `modelSrc` null in prod. Higgsfield workspace was out of credits → authored a **recognizable glasses GLB procedurally** (`scripts/build-demo-frame-glb.mjs`: 2 lens rims + bridge + temples + tinted lenses, 2322 verts/82 KB, **uncompressed → no Draco CDN decoder**) at `public/models/frame-demo.glb`. **Verified live (flag on, `/shop/accra`):** section + button render; click → @google/model-viewer chunk loads, custom element upgrades, `<model-viewer>` mounts with `src`/`alt`/`ar` set (as element *properties* — React 19 custom-element behavior), **`mv.loaded === true` (the authored GLB parses cleanly)**, glb served 200 same-origin, **zero console/CSP errors**. (`modelIsVisible`/`canActivateAR` false here = preview tab not compositing WebGL + desktop has no AR session; both resolve on a real device.) **Productionisation:** add a nullable `model_url` column to `frames` (one real `.glb`/frame), return it from `resolveFrameModel`, drop the flag; iOS Quick Look also needs a per-frame `.usdz` (`ios-src`).

**Verified (2026-06-14):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · **172/172 tests** ✓ · `pnpm build` ✓ (all routes; `/preview` gone). Live preview (env-less worktree → home uses FrameSVG/clinic fallbacks): light↔dark toggle flips body `#F5F0E8`↔`#0A1F35` + persists to `localStorage`, label swaps; header transparent at top → `rgba(10,31,53,.86)` + `blur(12px)` on scroll; all 6 home sections present in order; scroll-reveal 10/10 with no stuck-invisible content.

**Open caveats:**
- **Env wired (14 Jun):** copied staging `.env.local` into the worktree → home reel + shop verified against the **live catalogue** in both themes (home: 6 real frames incl. "Om3ga" GH₵499.99; shop: 7 frames, 3 tabs, `lm-card` gradient flips cream↔navy, name text stays readable, content clears the 72px fixed header). No `supabase link` done (not needed to run the app; only for `db push`/`gen types`). clinics/book/checkout/auth/account still not individually walked through.
- **Dark mode is only fully correct on home + shop + chrome this session.** Commerce/auth/clinics/book pages still use hardcoded `lumen-*` tokens → in dark mode they render as light content on the navy body (readable, not broken). Per-page conversion to `--lm-*` is the agreed follow-up.
- **OGL shader not runtime-exercised** (needs a TIER_2 desktop GPU + the detect-gpu benchmark; the preview is coarse/non-compositing so it stays on the CSS path). Risk contained: lazy-loaded, gated, `onError`→the verified CSS fallback.
- `public/preview/frame-hero.png` kept as the home hero asset (path unchanged).

**Next steps:**
1. **P1 features must not slip** (launch 6–12 Jul): US-P1-02 lens quiz (then repoint `LensQuizCta`), US-P1-06 account dashboard, US-P1-05 order tracking.
2. **Per-page dark-mode pass**: convert clinics/book/cart/checkout/auth/account `lumen-*` → `--lm-*`.
3. **Phase 3 productionisation** (POC done): real per-frame `.glb` models + `frames.model_url` column → flip `resolveFrameModel`, drop `NEXT_PUBLIC_DEMO_3D_ENABLED`; add `.usdz`/`ios-src` for iOS Quick Look. **Note:** `<model-viewer>` AR = "place frame in your room", NOT face-tracked try-on (that's a separate, heavier face-AR stack).

---

## 2026-06-11 — Production-audit fixes: broken links · SEO basics · auth hardening · CI supply-chain (audit §5 items 1/2/3/6)

**Status: 4 of 6 audit work items shipped** (working from `docs/site-audit-2026-06-10.md`, now committed with per-item status markers).

**What landed (4 commits, no migration):**
- **2.1 broken links** — header/footer no longer link unbuilt routes (`/lens-guide`, `/journal`, `/try-on`, `/account/prescriptions` all 404'd in prod; `TODO(US-P2-…)` markers for restoration). Booking links → `/book` (+ `?service=home-visit`); header nav gains "Book appointment". Placeholder social icons (bare `instagram.com` etc.) removed until Charity supplies real handles.
- **2.2 SEO basics** — `app/robots.ts` (disallow gated routes), `app/sitemap.ts` (static routes + active-frame PDPs via the cookie-less public client, env-guarded, 1 h revalidate), `app/opengraph-image.tsx` (1200×630 brand card, pixel-verified against brand tokens), root-layout `alternates.canonical "./"` (per-page self-canonical, drops query strings — verified `/shop?cat=sun` → `/shop`) + openGraph/twitter blocks, PDP canonical/OG + ~160-char description + `Product` JSON-LD (GHS from pesewa, In/OutOfStock).
- **2.4/2.5/2.6 auth hardening** — `@upstash/ratelimit@2.0.8` sliding windows (sign-in 5/15 min per IP+email · signup 5/h per IP · reset 3/h per email, enumeration-safe generic reply · checkout-initiate 10/h per user, 429+Retry-After). Keys SHA-256-hashed (no raw PII in Upstash, rule 10); **no-op without `UPSTASH_REDIS_REST_URL/TOKEN`**, fails open on Redis errors. `src/lib/rate-limit.ts` (+10 tests) / `src/server/rate-limit.ts`. `updatePassword` now revokes other sessions (`signOut({scope:"others"})`) and maps `reauthentication_needed` to a clear message.
- **2.8 supply chain** — CI gate `pnpm audit --prod --audit-level=high`, `.github/dependabot.yml` (weekly npm + actions, minor/patch grouped), baseline postcss moderate (GHSA-qx2v-qp2m-jg93 via next@16.2.7) cleared with pnpm override → 8.5.15; audit clean.

**Verified (2026-06-11):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · **172/172 tests** ✓ (+10) · `pnpm build` ✓ · `pnpm audit --prod` clean ✓ · live preview: all remaining header/footer hrefs 200, robots/sitemap/og-image 200, canonical/OG tags correct on `/`, `/shop?cat=sun`, `/book`.

**Open caveats / next:**
- **Set `UPSTASH_REDIS_REST_URL/TOKEN` in Vercel** (create free Upstash Redis DB) — limiter is inert until then; afterwards run audit tests 5–6 (429 on 6th sign-in; two-browser session revocation).
- **Audit §5 item 4 — dashboard checklist (no code):** Supabase "Secure password change" toggle + MFA for admin + auth rate limits/enumeration settings; Resend key + domain DNS; Sentry DSN + alert; UptimeRobot.
- **§5 item 5 — `perf/shop-caching` (2.3):** do the Vercel-function-region vs Supabase-region check first (dashboards), then the `/shop` caching pass.
- Real social handles + journal/lens-guide/try-on links restore with their P2 stories.

---

## 2026-06-11 — Sprint 7: US-P1-01 request appointment — /book flow + admin inbox

**Status: first P1 story shipped.** Public appointment requests now replace the interim clinic wa.me CTAs.

**What landed (migration `20260611000001_appointments.sql`):**
- **`appointments` table** — RLS-on, `set_updated_at` trigger, status text+CHECK (`requested|confirmed|cancelled|completed`, default `requested`), service text+CHECK. `user_id` (nullable FK `auth.users` on delete set null — null for anon), `clinic_id` (nullable FK `clinics`), `clinic_name` snapshot (clinic may be renamed/archived). Policies: `insert public` (`with check (true)` — anon + auth can create), `select own` (`auth.uid() = user_id`), `admin all` (`is_admin()`). `src/db/types.ts` regenerated.
- **Schema** `src/lib/appointment-schemas.ts` (+16 tests) — zod; `service` enum, **reuses `phoneSchema`/`normalizeGhanaPhone`** from checkout-schemas, email required (the confirmation channel), preferred-date not-in-past via `transform+ctx.addIssue`, notes max-len. `SERVICE_LABELS`/`APPOINTMENT_STATUSES` exported.
- **Server module** `src/server/appointments.ts` (`server-only`) — `createAppointment()` (RLS-client insert, env-guard), `listAppointments()`/`getAppointment()` (admin), `updateAppointmentStatus()`, `sendAppointmentEmails()` (best-effort, `Promise.allSettled`, non-fatal — customer + optional ops inbox `APPOINTMENTS_NOTIFY_EMAIL`; mirrors checkout email).
- **`/book` page** `src/app/(marketing)/book/**` — `force-dynamic` server component reads `?clinic=<slug>`/`?service=`, loads clinics via `getActiveClinics()` for the `<select>`, picks default clinic by slug → flagship → first. Single-column mobile-first `BookForm` (`"use client"`, `useActionState`, numeric phone keypad, native date) + success state. Server action re-validates (security boundary), captures `user_id` if signed in, then create + email.
- **Admin inbox** `src/app/admin/appointments/{page,[id]}` + actions — list + detail + status update; `requireAdmin()` in every page/action. Nav item added.
- **Clinic CTAs swapped** — `clinic-card.tsx` "Book here" → `/book?clinic=<slug>`; `home-visit-banner.tsx` "Book a home visit" → `/book?clinic=<flagship-slug>&service=home-visit` (slug threaded from `clinics/page.tsx`). Secondary "Chat on WhatsApp" links retained; `TODO(US-P1-01)` markers removed.

**Verified (2026-06-11):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ (+16) · `pnpm build` ✓ · e2e render checks ✓ — all green in CI.
  - Two CI fixes during the branch: Zod v4 `z.enum()` drops `{ errorMap }` (→ string-param `error`); the test fixture needed an **RFC-variant UUID** (`…-4111-8111-…`) because Zod v4's `z.string().uuid()` enforces variant bits, and the `/book` render check was scoped to `.first()` (EmptyState `h2` + footer `h3`s tripped Playwright strict mode).

**Open caveats:**
- **Migration `db push`ed to Lumen-staging (2026-06-11)** — `src/db/types.ts` regenerated from the live schema via `gen types --linked` (dropped a hand-aligned but incorrect `appointments→public.users` FK relationship; the FK targets `auth.users`). Prod still pending. The full submit→row→admin→status flow and anon-vs-owner RLS check remain **pending `pnpm seed` + a `SUPABASE_LINKED=1` e2e run** (Playwright browsers + dev server not available in the agent env).
- **Confirmation emails no-op** until the Resend domain is verified (SPF/DKIM/DMARC) and `APPOINTMENTS_NOTIFY_EMAIL` is set — built non-fatal so the insert never blocks.
- **Spam / rate-limiting / CAPTCHA on the public form is deferred** (noted in the plan as out-of-scope for v1) — revisit if abuse appears.

**Next steps (P1 continues):**
1. **US-P1-06 account dashboard** · **US-P1-05 order tracking** · **US-P1-02 lens quiz**.
2. Wire this worktree's env + `db push` the appointments migration + `pnpm seed`, then run the `SUPABASE_LINKED=1` e2e submission flow and the anon/owner RLS checks.

---

## 2026-06-10 — Sprint 6: US-P0-09 clinics — /clinics page + admin clinics CRUD + data-driven footer

**Status: all P0 stories (US-P0-01…09) now built.**

**What landed (no migration — `clinics` table already shipped in `20260608000002_content_catalogue.sql`):**
- **Opening-hours helpers** `src/lib/clinic-hours.ts` (+23 tests) — defensive `Json → OpeningHours` narrower (`parseOpeningHours`, mirrors `parseColors`) + `isOpenNow`/`todayHours`/`formatWeek`/`accraDayAndMinutes`/`formatGhanaPhone`. All Date-injectable; "open now" resolves in **Africa/Accra** via `Intl.DateTimeFormat` regardless of server TZ. `src/lib/wa-link.ts` (`waMeUrl`, +2 tests).
- **Server module** `src/server/clinics.ts` — `getActiveClinics()` (RLS publishable-key client, frames.ts pattern) + `getClinicFooterData()` for shared chrome via a new **cookie-less public client** `src/server/supabase-public.ts` (no `cookies()` → static pages stay static), wrapped in `unstable_cache({ tags:["clinics"] })`; admin actions bust it with `revalidateTag("clinics","max")`.
- **`/clinics` page** `src/app/(marketing)/clinics/**` — `force-dynamic` server component; hero count/cities **derived from data** (nothing hardcodes "4 locations"); `ClinicCard` (server-rendered open/closed status in Accra time, 7-day hours with "(today)" marker, service chips, map *placeholder* — no SDK per CSP/bundle budget) + `HomeVisitBanner` (hardcoded ₵250 copy from prototype). Booking CTAs are **interim wa.me deep links** (`// TODO(US-P1-01)`); EmptyState + loading skeleton.
- **Admin clinics CRUD** `src/app/admin/clinics/**` (+ `src/lib/clinic-schemas.ts`, +10 tests) — list/create/edit/archive-restore, **pulled forward from US-P2-04** so Charity can manage locations without a dev. `requireAdmin()` in every page+action, zod re-validation server-side (Ghana phones → E.164, per-day hours editor with closed-day normalisation), RLS-client writes, soft-delete via `is_active`. Nav item added.
- **Data-driven footer** `site-footer.tsx` now async — clinic names + location blurb from `getClinicFooterData` (generic fallback if none load); deep-links to `/clinics#<slug>`. **Twitter → X** (`x.com`, new `xSocial` glyph; old bird glyph + `clock` glyph handled in `icon.tsx`).

**Verified (2026-06-10):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · **146/146 tests** ✓ (+35).

**Open caveats:**
- **Pre-existing Turbopack + pnpm + Sentry build/dev break** in fresh worktree installs: `@sentry/nextjs` server/edge SDK can't resolve its transitive `@sentry/opentelemetry` through pnpm's nested symlinks on Windows (reproduced on the base commit a0ad9b8 — *not* introduced here). Fixed with a `.npmrc` `public-hoist-pattern` for `@sentry/*` + `@opentelemetry/*` (no version changes). `pnpm build` + live preview unblocked after reinstall.
- This worktree has **no `.env.local`/Supabase link**, so live `/clinics` shows the empty state and the footer uses the generic fallback. e2e `e2e/clinics.spec.ts` render checks run always; seeded-card checks are `test.skip`-guarded behind `SUPABASE_LINKED`. Wire env + `pnpm seed` for the full pass.

**Next steps (P0 complete → P1 / Tier 2):**
1. **US-P1-01 request appointment** — swap the clinics' interim wa.me CTAs for `/book?clinic=<slug>` (the `// TODO(US-P1-01)` markers).
2. **US-P1-06 account dashboard**, **US-P1-05 order tracking**, **US-P1-02 lens quiz**.

---

## 2026-06-09 — US-P0-08 view orders + auth-email/cart-scoping fixes (PRs #14–#19, backfilled)

Backfilled into the log (these merged to main but predate this entry):
- **US-P0-08 `/account/orders`** (PR #14, `3c24974`) — customer order list + detail behind `requireUser()` (layout gate), RLS-scoped reads, `OrderStatusPill` + `orderStatusDisplay` tone helper, `force-dynamic`. The checkout success/callback pages link here.
- **Fixes:** order_items customer INSERT RLS policy (#15, `3e7d08d`); branded auth emails + redirect-back on signup confirm (#16/#17); email sender + seed prod-guard pointed at lumeneye.org with hostname-parse fix for CodeQL (#18); long payment-reference + order-detail overflow wrap (#17); **cart cleared on auth-user change** + dual-purpose signup copy, with `CartAuthSync` a no-op when Supabase env is absent (#19).

---

## 2026-06-09 — Observability: Sentry + Vercel Analytics + /api/health

**Why now:** checkout is live in prod with no monitoring. Added a *proportionate*
layer (Handoff §2: Sentry free tier + Vercel default analytics, no GA4).

**What landed (no migration; deps `@sentry/nextjs@10`, `@vercel/analytics`, `@vercel/speed-insights`):**
- **Decision — Sentry transport = tunnel, not direct ingest.** `next.config.ts`
  wraps in `withSentryConfig` with `tunnelRoute:'/monitoring'`, so browser events go
  same-origin (covered by `connect-src 'self'`) → **zero CSP widening** (rule 9) and
  ad-blockers can't drop them. Source maps deleted after upload (no public source
  disclosure). `proxy.ts` carries a comment so nobody "fixes" the CSP by adding the
  ingest domain; `/monitoring` + `/api/health` excluded from the proxy matcher.
- **PII scrubbing (rule 10)** — `src/lib/sentry-scrub.ts` (pure, **6 unit tests**) is
  the shared `beforeSend`/`beforeSendTransaction` for all three configs
  (`sentry.server/edge.config.ts`, `instrumentation-client.ts` via `instrumentation.ts`
  + `onRequestError`). Drops `user`, request body/cookies/query-string/sensitive
  headers, and redacts email/phone/reference-shaped values. `sendDefaultPii:false`,
  **no Session Replay**, `tracesSampleRate:0` (errors-only, stays inside 5K/mo).
- **Payment-path captures** — webhook (`insert`/`update` errors + charge-mismatch)
  and checkout-initiate (both Paystack-init `catch`es) tagged `area:'paystack-webhook'`
  / `area:'checkout'`, context = **order id + codes only**. The 401 signature failure
  is intentionally **not** captured (attacker-driven quota burn).
- **Vercel Analytics + Speed Insights** in `src/app/layout.tsx` (no env vars).
- **`/api/health`** — app + Supabase HEAD-count probe via the RLS client (no secret,
  rule 5); 200 ok / 503 on DB failure; body leaks no error text or version.
- **Env** — `NEXT_PUBLIC_SENTRY_DSN` (public, optional in `env.ts`; SDK no-ops without
  it) + build-only secret `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT`.

**Open caveats (dashboard/deploy steps — see `docs/observability.md`):** create the
Sentry project + DSN; set the build-only `SENTRY_*` vars in Vercel; enable Analytics +
Speed Insights; create the **payment-path alert** (`area in (paystack-webhook,checkout)`
+ `environment:production` → email); add **UptimeRobot** monitors for `/` and
`/api/health`. Sentry stays inert until the DSN is set.

---

## 2026-06-09 — Sprint 5: US-P0-05/06/07 checkout funnel (MoMo · card · COD)

**What landed (migration `20260609000001_checkout.sql` + Paystack hosted checkout):**
- **Decisions (deviate from signed Handoff — see memory `checkout-decisions`):** **E-Levy dropped** (repealed in Ghana 2 Apr 2025; `e_levy_amount` stays 0, no disclosure). **Sign-in required** for checkout (guest deferred; RLS `orders insert own` stays clean). **Paystack hosted-checkout redirect** for MoMo+card (one Initialize → `authorization_url`); COD bypasses Paystack (`cod_pending`).
- **Migration** — delivery snapshot columns (`delivery_name/phone/city/address/landmark`) + unique `idempotency_key` on `orders`; an **append-only status trigger** blocks `paid → pending/failed/*` so a replayed/late webhook can't downgrade a fulfilled order. RLS unchanged. Types regenerated.
- **Server re-pricing spine** `src/lib/checkout-pricing.ts` (pure `priceLines` + `isPaidChargeValid`, unit-tested) + `src/server/checkout.ts` (`repriceCart` loads frames from DB and prices server-side — **never trusts the client cart**; `createPendingOrder` inserts order+items via the RLS client; best-effort confirmation email mirrors `admin/orders/actions.ts`). `src/lib/checkout-schemas.ts` (zod; Ghana phone → E.164 via `libphonenumber-js`).
- **Route handlers** — `POST /api/checkout/initiate` (sign-in 401-gate, `Idempotency-Key` reuse, re-price, Paystack init with explicit `currency:'GHS'`), `POST /api/paystack/webhook` (raw-body HMAC → ack non-charge → amount/currency anti-tamper → claim `webhook_events.paystack_event_id` for idempotency → `pending→paid` via service-role → email; 401 on bad sig), `GET /api/orders/status?reference=` (RLS-scoped poll).
- **UI** `src/app/(commerce)/checkout/**` — `/checkout` (server `requireUser` + client form: delivery + MoMo/card/COD + summary), `/checkout/callback` (polls status up to 5 min, success/failure/timeout states), `/checkout/success` (order summary, clears cart). Checkout CTA enabled in `cart-view.tsx` + `cart-drawer.tsx`; `/checkout` added to the `proxy.ts` auth gate.
- **Paystack helper hardening** `src/server/paystack.ts` — `initializeTransaction` now takes `currency`; `paystackFetch` surfaces Paystack's error message (caught the "Invalid Email" + currency issues during verification).

**Verified (2026-06-09):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · 97/97 tests ✓ (+21) · `pnpm build` ✓ (all 6 checkout routes). **Webhook (headless, signed payloads):** valid→`paid`, replay→`200` no-op, bad-sig→`401`, amount-mismatch→not fulfilled, `paid→pending` blocked by trigger. **COD (signed-in, Preview MCP):** order `cod_pending`, DB-priced GH₵580, cart cleared, visible in `/admin/orders`. **MoMo/card init:** Paystack returns `checkout.paystack.com` URL for both channels.

**Open caveats:**
- A failed Paystack init leaves a dangling `pending` order (created before the Paystack call) — harmless (never payable); a later reaper or pre-init validation could tidy it.
- Live in-browser redirect couldn't be exercised with the seed admin (`admin@lumen.local` — Paystack rejects non-routable emails); real customer emails are fine. Order-confirmation emails no-op until `RESEND_API_KEY` + domain verification.
- Webhook fulfilment needs the Paystack dashboard webhook URL set per environment; local dev can't receive Paystack callbacks (verified by simulating signed events).

**Next steps:**
1. **US-P0-08 view orders** — `/account/orders` list + detail so customers see these orders (the success/callback pages already link there).
2. **US-P0-09 clinics** — self-contained; `clinics` table seeded.

---

## 2026-06-09 — Sprint 4: US-P0-02 frame detail + US-P0-03 add to cart + shared UI-state primitives

**What landed (no migration — client-side cart on the existing schema):**
- **Cart store (zero-dep)** `src/lib/cart.ts` + `src/components/cart/cart-provider.tsx` — pure reducer/selectors (`addItem`/`changeQty`/`removeItem`/`selectCount`/`selectSubtotalPesewa`, `parseStoredCart`) behind a React Context + `useReducer` provider. **Chose Context over Zustand** to avoid a runtime dep + stay SSR-safe (no module-level global; 2026 App-Router guidance warns those leak across requests). Persisted to `localStorage` (`lumen.cart.v1`); hydration runs in an effect with the `hydrated` flag folded into the reducer (single dispatch — satisfies React 19's `set-state-in-effect` lint). Line key = `frameId::colorName`; qty capped at the stock snapshot. **22 new tests (74/74 total).** Frame-only — lens/Rx deferred to US-P2-02. `// NOTE`: checkout must re-price server-side from DB, never trust the client cart.
- **PDP — US-P0-02** `src/app/(marketing)/shop/[slug]/page.tsx` stays a Server Component (data + breadcrumb + metadata + related frames); interactive parts extracted to `src/components/organisms/frame-purchase-panel.tsx` (`"use client"`) — colour selector (updates swatch/`FrameSVG`/photo), stock-aware **Add to bag** → `cart.add()` + toast + opens drawer; out-of-stock disables. Non-interactive "lens builder coming soon" notice (US-P2-02). "You might also like" reuses `FrameCard` (`getActiveFrames(category)` minus current, 4). LCP image gets `priority` + `sizes`. Dropped the design's invented "4.9 · 248 reviews" / MoMo-installment copy (no real data).
- **Cart drawer + page — US-P0-03** `src/components/organisms/cart-drawer.tsx` (global slide-over, mounted in root layout: `role=dialog`/`aria-modal`, ESC, focus move+trap, body-scroll-lock) + `src/app/(commerce)/cart/{page,cart-view}.tsx` (real bag: server wrapper keeps metadata+chrome, client `CartView` renders lines/subtotal/empty-state, with a pre-hydration skeleton to avoid empty-flash). Shared `src/components/cart/cart-line-item.tsx` (qty steppers + remove). `site-header.tsx` cart icon now **opens the drawer + shows a live count badge**.
- **Shared UI-state primitives (the gap we had)** `src/components/atoms/toast.tsx` (`ToastProvider`/`useToast`, single `aria-live=polite` region, auto-dismiss) · `src/components/atoms/empty-state.tsx` (reusable, link or button CTA) · `src/app/(commerce)/error.tsx` (first route-level error boundary — turns swallowed data errors into a recoverable state). `icon.tsx` gained `plus`/`minus`/`trash`.
- **Tooling** `.claude/launch.json` added for the Preview MCP dev server.

**Verified (2026-06-09):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · 74/74 tests ✓ · `pnpm build` ✓ (`/cart` static shell + client view; `/shop/[slug]` dynamic). **Live (Preview MCP, no DB needed for the client cart):** seeded localStorage → reload hydrates badge=3 + both lines + subtotal GH₵1,880.00; drawer opens with scroll-lock; qty stepper caps at stock (button disables, persisted qty clamped); remove drops line+badge; ESC closes + restores scroll; `/cart` empty state renders.

**Open caveats:**
- **PDP "Add to bag" button not exercised end-to-end here** — this worktree has no `.env.local`/Supabase link, so `/shop/[slug]` `notFound()`s without seeded frames. The button routes through the unit-tested + live-verified `frameToCartItem`→`add()` path. Wire env + `pnpm seed` for a full manual pass.
- Frame `photo_urls` still unseeded → `FrameSVG` is the rendered visual (cart thumbnails included) until admins upload photos.
- `error.tsx` is commerce-segment only; retrofitting other segments + loading states is a later pass.

**Next steps:**
1. **US-P0-09 clinics** — self-contained; `clinics` table seeded; no dependencies.
2. **US-P0-05/06/07 checkout** — MoMo / card / COD on the cart store; server-side re-pricing + Paystack init + idempotency.
3. **Wire this worktree's `.env.local` + `supabase link` + `pnpm seed`** to manually verify the PDP add-to-bag flow against real frames.

---

## 2026-06-08 — Sprint 3: US-P0-01 browse frames — /shop catalogue + marketing shell

**What landed (PR #9 — built on existing schema + seed data, no migration needed):**
- **Marketing shell** `src/app/(marketing)/layout.tsx` + `src/components/organisms/{site-header,site-footer}.tsx` — sticky scroll-shadow nav with mobile hamburger drawer, 5-col footer; reused by every storefront route going forward. Home page (`app/page.tsx`) includes chrome explicitly to avoid a Next.js duplicate-route conflict with the `(marketing)` group.
- **Design system atoms** ported from `docs/design/shared.jsx`: `icon.tsx` (24-glyph SVG set), `logo-mark.tsx`, `frame-svg.tsx` (6-shape procedural renderer — near-zero HTTP weight for slow-4G / mid-range Android baseline).
- **Server data layer** `src/server/frames.ts` (`server-only`) — `getActiveCategories()`, `getActiveFrames(categorySlug?)`, `getFrameBySlug(slug)` via the RLS-gated publishable-key client. `Json → FrameColor[]` type-narrower; no admin-client bypass anywhere in the shop path.
- **Filter module + tests** `src/lib/shop-filters.ts` — URL is the single source of truth for filter/sort state (shareable, SEO-friendly, back-button safe). `parseShopParams()` whitelists every param (no raw user strings reach SQL); `applyShopFilters()` pure in-memory faceting + sort (featured/newest/price-low/price-high) + per-facet counts. 25 new tests (52/52 total).
- **`/shop` page** `src/app/(marketing)/shop/page.tsx` — Server Component, `force-dynamic`, async `searchParams`; DB-driven `hero_title`/`hero_subtitle` from `frame_categories`; `<ShopTabs>` category switcher; desktop sidebar + mobile slide-in filter drawer; active-filter chips; result count; skeleton `loading.tsx`; empty state + contacts-clinic-redirect state.
- **`FrameCard`** `src/components/molecules/frame-card.tsx` — `next/image` with `priority` on first 4 cards + lazy below fold; `FrameSVG` fallback when `photo_urls` is empty (current state of seed data); badge colour-coded (BESTSELLER/NEW/LIMITED); `formatGhs(price_ghs)` price; colour swatches.
- **Stub PDP** `src/app/(marketing)/shop/[slug]/page.tsx` — `getFrameBySlug` → `notFound()` on bad slug; shows FrameSVG/photo, price, swatches, stock indicator, "lens builder coming soon" WhatsApp notice; back-to-shop link. Real US-P0-02 PDP is next.
- **Cart placeholder** `src/app/(commerce)/cart/page.tsx` — stub so header cart icon has no 404 until US-P0-03/05 land.

**Verified (2026-06-08):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · 52/52 tests ✓ · `pnpm build` ✓ (`/shop` + `/shop/[slug]` dynamic, `/cart` static) · `pnpm seed` data confirmed rendering in dev.

**Open caveats:**
- Frame `photo_urls` are not seeded — `FrameSVG` is the rendered visual until admins upload photos via `/admin/frames`. No code change needed; photos appear automatically once uploaded.
- `app/(marketing)/page.tsx` has a `redirect("/shop")` default export only to satisfy Next.js build validation; outer `app/page.tsx` handles `/` in practice.

**Next steps:**
1. **US-P0-02 frame detail** — real PDP with colour selector, stub lens builder accordion, "add to bag" CTA (lens/prescription options deferred to US-P2-02).
2. **US-P0-09 clinics** — self-contained; `clinics` table is seeded; no other dependencies.
3. **US-P0-03/05/06/07 cart + checkout** — the commerce funnel.

---

## 2026-06-08 — Sprint 2: US-P1-07 basic admin (frames CRUD + orders)

**What landed (no migration — built entirely on the existing schema + 3 security layers):**
- **Admin shell** `src/app/admin/{layout,page}.tsx` + `_components/{admin-ui,admin-nav}.tsx` — utilitarian sidebar layout on brand tokens (Handoff §4). `requireAdmin()` runs in the layout AND every page/action (rule 3: proxy → handler → RLS); `force-dynamic` so no shell is cached cross-user.
- **Frames CRUD** `src/app/admin/frames/**` — list (incl. archived via admin RLS), create, edit, **soft-delete = archive** (`is_active=false`, preserves `order_items` history), restore. Full storefront field set (name, slug, price, stock, description, category, shape, gender, material, badge, colours, photos). Photo upload posts a File through the server action → validated (mime/size) → uploaded to the public `frames` bucket via the RLS client (storage `frames admin write` requires `is_admin()`). `revalidatePath('/shop')` after every write. Price entered in GHS, stored integer pesewa.
- **Orders** `src/app/admin/orders/**` — read-only list + detail (items, customer, totals, payment); **mark-shipped** action flips `status='shipped'` (already a valid enum value) via RLS client + sends a best-effort Resend email (status persists even if email fails). Reuses `formatGhs`.
- **Validation** `src/lib/frame-schemas.ts` (+ tests) — zod, re-validated server-side in every action.
- **Seed bootstrap** — `src/lib/seed.ts` now creates the env-driven admin user (`app_metadata.role='admin'`, via `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) + 2 mock orders so `/admin` is testable. `.env.example` documents the new vars.
- **Config** — `next.config.ts` `serverActions.bodySizeLimit: '6mb'` for photo posts (Supabase host already in `images.remotePatterns`).

**Verified (2026-06-08):** `pnpm typecheck` ✓ · `pnpm lint` ✓ · 27/27 tests ✓ · `pnpm build` ✓ (all `/admin/*` routes dynamic) · `pnpm seed` ✓ (admin user + mock orders) · runtime: unauthenticated `/admin` + `/admin/frames` → 307 to `/sign-in?redirect=…` (proxy gate), `/sign-in` 200, no dev-log errors.

**Scope note:** US-P1-07 covers **frames + orders** only. `frame_categories` / `clinics` / `journal_posts` remain DB/seed-managed (admin RLS allows writes) until **US-P2-04 Full Admin**. The frame form *selects* a category but can't create one yet.

**Open caveat:** shipped-email needs Resend domain verification (SPF/DKIM/DMARC) before it leaves spam; built non-fatal so fulfilment never blocks. `ADMIN_EMAIL_DOMAINS` auto-grant-on-signup is still unbuilt — admins are provisioned via seed for now.

---

## 2026-06-08 — Schema: content catalogue (data-driven requirement)

**Migration:** `supabase/migrations/20260608000001_content_catalogue.sql`

**What landed:**
- `frame_categories` — lookup table replacing `frames.type CHECK('optical','sun')` enum. Each shop collection tab is now a DB row with its own `hero_title` / `hero_subtitle` copy. New collections (e.g. contacts, kids) are a DB insert, no code change.
- `frames` altered — `category_id` (FK → `frame_categories`), `gender` (`men`/`women`/`unisex`), `material` (filterable class) added. Old hardcoded `type` column + `frames_type_check` constraint dropped.
- `clinics` — new table (US-P0-09). Per-day `opening_hours jsonb`, `services text[]`, `is_flagship`, `latitude`/`longitude` for map pin. Was fully hardcoded in `docs/design/clinics.jsx`.
- `journal_categories` + `journal_posts` — new tables (US-P2-03). Posts have draft/published status; public RLS shows `published` only. `body` field (markdown) added — not in the prototype. Was fully hardcoded in `docs/design/journal.jsx`.
- `journal` storage bucket — public read / admin write; mirrors `frames` bucket pattern.
- All five tables: RLS ON, `public.is_admin()` admin policies (Security rule 6).

**Applied + verified (2026-06-08):**
- `pnpm supabase db push` — migration applied to staging ✓
  - Note: `20260608000001_frames_active.sql` (from `feature/admin-frames-orders`) was already on remote; our migration numbered `00002` to avoid collision. `frames_active.sql` brought into this branch's migrations dir for history consistency.
- `pnpm supabase gen types` → `src/db/types.ts` regenerated; all 5 new tables present ✓
- `pnpm typecheck` ✓ · `pnpm lint` ✓ · 17/17 unit tests ✓
- `pnpm seed` — 3 frame categories, 8 frames, 4 clinics, 5 journal categories, 6 journal posts inserted into staging ✓
  - `package.json` seed script updated: `tsx --env-file=.env.local src/lib/seed.ts` (Node 20.6+ `--env-file` flag; no dotenv dependency needed)

**Deferred (known hardcoded):** lens types / add-ons / Rx options in `docs/design/frame-detail.jsx` — defer to US-P2-02 Lens Builder migration.

---

## 2026-06-07 — Sprint 1: US-P0-04 sign up & sign in

**Branch:** `claude/priceless-pascal-36f72a`

**What landed (auth UI + actions on the existing security spine):**
- `(auth)` route group: `/sign-in`, `/sign-up`, `/reset-password`, `/update-password` (Server Component pages + `"use client"` forms via `useActionState`), shared layout + `_components/auth-ui.tsx`.
- `src/app/(auth)/actions.ts`: `signUp` / `signIn` / `requestPasswordReset` / `updatePassword` / `signOut` on the RLS-gated publishable-key client. Every action re-validates with zod (`src/lib/auth-schemas.ts`, +tests), redirects through `safeRedirect()`, and returns **generic** errors (no account enumeration). Name flows to `public.users` via the existing `handle_new_user` trigger; role is never set from the client.
- `src/app/auth/confirm/route.ts`: email-confirm + recovery landing using `verifyOtp({ type, token_hash })`, `next` guarded by `safeRedirect()`.
- e2e: `e2e/auth.spec.ts` — render checks run always; full sign-up→sign-in flow `test.skip`-guarded behind `SUPABASE_LINKED` until cloud setup lands.

**Verified:** typecheck ✓, lint ✓, unit 17/17 ✓, build ✓ (routes `/sign-in` `/sign-up` `/reset-password` `/update-password` `/auth/confirm`). Live auth still **BLOCKED** on Supabase link (below).

**Pre-launch auth dashboard config (not code — track + do before prod):**
1. **Email templates → token_hash flow** so links hit `/auth/confirm` (e.g. confirm: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account`; recovery: `type=recovery&next=/update-password`).
2. **Redirect URL allowlist**: add `${SITE_URL}/auth/confirm` for localhost + staging + prod, or links are rejected.
3. **Custom SMTP (Resend)** — built-in email is rate-limited (~few/hr) and won't meet the ≤30s criterion; set SPF/DKIM/DMARC.
4. **Email enumeration protection** ON (so `signUp` obfuscates existing emails). **Min password length = 8** to match `auth-schemas.ts`.
5. **Leaked-password protection (HaveIBeenPwned)** — Pro-plan only; flag as a launch-cost decision. **CAPTCHA (Turnstile)** deferred (would need a CSP `script-src`/`frame-src` widen for `challenges.cloudflare.com`).
6. Dev: email confirmation OFF to test sign-up→sign-in without an inbox; ON in prod.

---

## 2026-06-07 — Sprint 0: Staging Supabase wiring (code prep)

**Branch:** `claude/clever-mayer-148317`

**What landed (code side, ahead of cloud link):**
- Adopted **new-format Supabase API keys** (`sb_publishable_…` / `sb_secret_…`) across all clients + env validation, replacing the deprecated legacy anon/service_role JWTs (Supabase deletes legacy keys end of 2026). Env vars renamed: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY` (`env.ts`, `supabase.ts`, `supabase-browser.ts`, `supabase-admin.ts`, `.env.example`, CLAUDE.md).
- `config.toml` local label renamed `dazzling-shockley-69161a` → `lumen`.
- Doc fixes: migration path corrected to `supabase/migrations/` (was wrongly `src/db/migrations/`); `gen types` docstring updated to flag form.

**Decisions:** staging is **dev-owned** (not blocked on Charity); new `sb_` keys adopted now.

**Done (verified):** ① `lumen-staging` created + linked, ② `db push` applied + types generated (`src/db/types.ts` is real — six tables, live PG metadata), ③ RLS `relrowsecurity = true` confirmed on all six tables, ④ the 3 `sb_*` env vars set in `.env.local` + Vercel staging.

**Storage buckets — now captured as code:** `supabase/migrations/20260607000001_storage.sql` provisions `frames` (public, admin-write) + `prescriptions` (private; owner/admin object policies, signed-URL access). Idempotent (`on conflict do update` + `drop policy if exists`), safe over manually-created buckets. **Apply with `supabase db push`** (pending). Browse/US-P0-01 unblocks once the `frames` bucket exists.

---

## 2026-06-06 — Sprint 0 Day 1: Scaffold complete

**Branch:** `claude/dazzling-shockley-69161a`

**What landed:**
- Next.js 16.2.7 LTS + React 19 + Tailwind v4 (CSS-first `@theme`), intentionally newer-stable than signed docs
- Full security spine: safe-redirect, CORS allowlist, admin 3-layer (proxy + handler + RLS), Paystack raw-body HMAC, Supabase RLS-on, CSP headers, signed-URL pattern
- `src/proxy.ts` (next 16 renamed middleware convention), server-only auth clients, brand tokens
- Vitest unit (8/8), Playwright e2e (1/1), Lighthouse CI, seed stub
- Initial migration (`supabase/migrations/20260606000001_init.sql`): users, frames, orders, order_items, webhook_events, prescription_access_log — all RLS-on with owner + admin policies
- Route-group skeleton (marketing, auth, commerce, admin) locked in for Sprint 1

**Verified:** typecheck ✓, lint ✓, test ✓, build (Turbopack) ✓, e2e ✓
**Commits:** 2 (scaffold 51 files + CLAUDE.md version bump for Next 16/Tailwind v4/proxy)

**Open gotchas:**
- Supabase project not yet linked (`pnpm supabase link lumen-staging` pending) — can't `gen types` or apply migration
- Paystack/Resend API keys not wired (`.env.example` has placeholders only)
- Seed data bodies are stubs (filled in Sprint 1 with real frames + clinics)

**Next steps:**
1. **Sprint 0 cloud setup:** Link staging Supabase project, apply `0001_init.sql` migration, verify RLS policies
2. **Wire secrets:** Real Paystack public/secret, Resend API key (all three from Charity or test sandboxes)
3. **Sprint 1 kickoff:** US-P0-01 (browse frames) — requires seed frames + /shop page

---
