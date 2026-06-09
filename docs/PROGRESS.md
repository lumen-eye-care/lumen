# PROGRESS.md — Lumen v1 Build Log

**How to use:** Keep this to ~one screen (current state + next steps only). Git history preserves detail; trim stale entries here. Update at merge-to-main points, not on every feature branch (avoids conflicts). Newest entries at top.

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
