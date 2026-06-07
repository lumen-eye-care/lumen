# PROGRESS.md — Lumen v1 Build Log

**How to use:** Keep this to ~one screen (current state + next steps only). Git history preserves detail; trim stale entries here. Update at merge-to-main points, not on every feature branch (avoids conflicts). Newest entries at top.

---

## 2026-06-07 — Sprint 0: Staging Supabase wiring (code prep)

**Branch:** `claude/clever-mayer-148317`

**What landed (code side, ahead of cloud link):**
- Adopted **new-format Supabase API keys** (`sb_publishable_…` / `sb_secret_…`) across all clients + env validation, replacing the deprecated legacy anon/service_role JWTs (Supabase deletes legacy keys end of 2026). Env vars renamed: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY` (`env.ts`, `supabase.ts`, `supabase-browser.ts`, `supabase-admin.ts`, `.env.example`, CLAUDE.md).
- `config.toml` local label renamed `dazzling-shockley-69161a` → `lumen`.
- Doc fixes: migration path corrected to `supabase/migrations/` (was wrongly `src/db/migrations/`); `gen types` docstring updated to flag form.

**Decisions:** staging is **dev-owned** (not blocked on Charity); new `sb_` keys adopted now.

**Still pending (needs dashboard + credentials — run by a dev):**
1. Create `lumen-staging` (dev org, Postgres 17), `supabase login` + `link --project-ref`
2. `supabase db push` (apply init migration), then `gen types --linked --lang typescript --schema public > src/db/types.ts`
3. Verify `relrowsecurity = true` for all six tables (`webhook_events` RLS-on/no-policy and `prescription_access_log` admin-read-only are by-design)
4. Set the 3 Supabase env vars in `.env.local` + Vercel staging

**New gotcha:** Storage buckets `frames` (public) + `prescriptions` (private) are **not** created by the init migration — needs a follow-up `supabase/migrations/<ts>_storage.sql` (browse/US-P0-01 needs the `frames` bucket).

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
