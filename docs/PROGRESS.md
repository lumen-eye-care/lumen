# PROGRESS.md — Lumen v1 Build Log

**How to use:** Keep this to ~one screen (current state + next steps only). Git history preserves detail; trim stale entries here. Update at merge-to-main points, not on every feature branch (avoids conflicts). Newest entries at top.

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
