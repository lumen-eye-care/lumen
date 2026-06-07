# PROGRESS.md — Lumen v1 Build Log

**How to use:** Keep this to ~one screen (current state + next steps only). Git history preserves detail; trim stale entries here. Update at merge-to-main points, not on every feature branch (avoids conflicts). Newest entries at top.

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
