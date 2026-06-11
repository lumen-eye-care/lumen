# Site Audit — www.lumeneye.org — 10 June 2026

**Purpose:** self-contained handoff of the production audit done 10 June 2026, so a
future session can implement fixes without re-deriving findings. Covers headers,
SEO, performance, auth security, admin authorization, and the payment path.

**Method:** live HTTP probes against production (curl: headers, status codes,
timings, unauthenticated probes of every gated route), plus code review of the
auth/admin/payment paths in this repo. PageSpeed Insights could **not** be run
(anonymous API quota exhausted — see "Tests still to run").

---

## 1. What is VERIFIED GOOD — do not redo, do not "fix"

| Area | Evidence |
|---|---|
| Security headers | CSP (per CLAUDE.md rule 9), HSTS `max-age=63072000`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` — present on every response (set in `src/proxy.ts`). |
| Domain | Apex → www is a clean 308. Homepage is prerendered + edge-cached (`X-Vercel-Cache: HIT`). |
| Auth gates (live-probed) | `/admin`, `/checkout`, `/account` → 307 to `/sign-in?redirect=…`; `POST /api/checkout/initiate` → 401; `GET /api/orders/status` → 401; webhook with bad signature → 401. |
| Admin authorization | All three layers confirmed in code: proxy fast-deny (`src/proxy.ts`), `requireAdmin()` in the admin layout + **every** admin page and server action (`src/app/admin/**`), RLS underneath. Role read only from `app_metadata`. |
| Payment path | Walked every attack scenario in `src/app/api/paystack/webhook/route.ts` + `src/app/api/checkout/initiate/route.ts`: client-price tampering (server re-prices from DB), forged webhook (raw-body HMAC-SHA512 → 401), wrong-amount/currency charge (anti-tamper check + Sentry alert), replay (unique `paystack_event_id`), paid→pending downgrade (DB trigger), double-submit (Idempotency-Key). `findOrderByIdempotencyKey` uses the RLS client → scoped to own orders (no cross-user probe). Card/MoMo details never touch our servers (Paystack hosted checkout — no PCI scope). |
| XSS / SQLi | No `dangerouslySetInnerHTML` / `innerHTML` / `eval` in `src/`; all DB access via parameterized Supabase client; shop filter params whitelisted in `src/lib/shop-filters.ts`. |
| Health/404 | `/api/health` 200 `{db: ok}`, leaks nothing. Branded 404 with `noindex`. |

---

## 2. Improvements — prioritized backlog

### P0 — launch blockers (cheap, do first)

#### 2.1 Broken links in live header/footer
- `src/components/organisms/site-header.tsx:19` — main nav links `/lens-guide` → **404 in prod**.
- `src/components/organisms/site-footer.tsx` — links `/journal`, `/try-on`, `/lens-guide` (all 404) and `/account/prescriptions` (route doesn't exist; signs in then 404s). Lines ~51–62.
- Social icons point at **placeholder bare domains** (`https://facebook.com`, `https://instagram.com`, `https://x.com`) — lines ~90–108.
- **Fix:** hide unbuilt-feature links until their P2 user stories ship (or add "coming soon" stubs). Get real social handles from Charity (WhatsApp +233 24 562 8432).

#### 2.2 SEO / link-sharing basics — all missing
Verified live: `robots.txt` → 404, `sitemap.xml` → 404, **no Open Graph / Twitter
Card tags, no canonical URL on any page** (homepage + PDP checked). For a DTC
brand launching via Instagram/WhatsApp, shared links currently render with no
preview card.
- `metadataBase` already set in `src/app/layout.tsx:32` — wiring is cheap.
- **Fix:** add `src/app/robots.ts`, `src/app/sitemap.ts` (frames + clinics from DB
  via the RLS client), an `opengraph-image` (1200×630, brand cream/ink), and
  `openGraph` + `twitter` blocks in root layout metadata + PDP `generateMetadata`.
- PDP bonus: `Product` JSON-LD (name, image, price in GHS, availability) for rich results.
- PDP meta description is thin ("Accra — Italian Acetate by Lumen Eye Care.") — fold in frame description.

#### 2.3 Dynamic-page TTFB blows the performance budget
Measured: `/shop` and PDP **6.0–6.6 s cold, ~1.5 s warm** (`force-dynamic`,
`Cache-Control: private, no-cache, no-store`; served `cpt1` edge → `iad1` US
function). Budget is API p50 < 300 ms / p95 < 800 ms.
- **Step 1 (5 min, dashboards):** check Vercel function region vs Supabase project
  region; co-locate. Prefer the Supabase/Vercel region pairing closest to Ghana
  (likely `eu-west`/`fra1`/`cdg1` — confirm what Supabase offers; see research list).
- **Step 2:** admin writes already call `revalidatePath('/shop')`, so the catalogue
  can be cached: render the unfiltered `/shop` statically/ISR and apply
  filters client-side, or use Next 16 `'use cache'` / `s-maxage`. The
  `searchParams` read is what forces dynamic today.

### P1 — security hardening (one branch: `fix/auth-hardening`)

#### 2.4 Rate limiting — the only real application-layer hole
No rate limiting anywhere in `src/` (grep-verified). Key nuance: sign-in runs in a
**server action**, so Supabase sees Vercel's egress IP, not the client's — Supabase's
per-IP throttle can't distinguish attacker from customers (and could self-DoS all
users if tripped).
- **Exposed endpoints:** `signIn`, `requestPasswordReset`, `signUp`
  (`src/app/(auth)/actions.ts`) and `POST /api/checkout/initiate` (each call
  creates a pending order row).
- **Abuse cases:** credential stuffing; burning the Resend 3K/mo quota + spamming
  inboxes via the reset form; pending-order table bloat.
- **Fix:** `@upstash/ratelimit` + Upstash Redis (free tier, ~500K commands/mo, fits
  GHS budget). Key on client IP (`x-forwarded-for`, Vercel-set) + email. Suggested:
  sign-in 5/15 min per IP+email; reset 3/hour per email; signup 5/hour per IP;
  initiate 10/hour per user. Vercel WAF rate limiting is Pro-tier (out of budget).
  Turnstile CAPTCHA stays deferred (needs CSP widening for `challenges.cloudflare.com`).

#### 2.5 Sessions survive a password change
`updatePassword` in `src/app/(auth)/actions.ts:143` calls `updateUser({password})`;
Supabase does **not** revoke other devices' refresh tokens. A user resetting a
password after compromise leaves the attacker's session alive.
- **Fix (one line, after successful update):**
  `await supabase.auth.signOut({ scope: "others" });`

#### 2.6 Password change without current password
Any live session can call `updateUser({password})` — a hijacked session (shared
computer, common locally) can lock out the real owner.
- **Fix:** enable **"Secure password change"** in Supabase Dashboard → Auth →
  Providers → Email (free), then handle the `reauthentication_needed` error path
  in the action (research exact flow — see §4).

#### 2.7 Admin account has no 2FA
Code can't prevent a weak/reused admin password. Supabase TOTP MFA is free-tier.
- **Fix:** enable MFA enrolment for the admin account; optionally enforce via
  `aal2` check in `requireAdmin()` (research current API — see §4).

#### 2.8 Supply chain — the realistic 2026 attack vector
- **Fix:** add `pnpm audit --prod` (or `--audit-level=high`) to CI
  (`.github/workflows/`), enable GitHub Dependabot alerts + security updates.

### P2 — operational / polish

| # | Item | Detail |
|---|---|---|
| 2.9 | `RESEND_API_KEY` unset in prod | Order-confirmation + shipped emails silently no-op today. Set key in Vercel + verify domain SPF/DKIM/DMARC. |
| 2.10 | Sentry not live | DSN + `SENTRY_*` build vars not set in Vercel; payment-path alert (`area in (paystack-webhook, checkout)` + `environment:production`) and UptimeRobot monitors (`/`, `/api/health`) not created. See `docs/observability.md`. |
| 2.11 | Supabase auth dashboard pass | Email enumeration protection ON; min password length 8 (matches `auth-schemas.ts`); tighten built-in auth rate limits (second layer behind 2.4). |
| 2.12 | HSTS | Add `includeSubDomains; preload` once confirmed no subdomain needs HTTP. |
| 2.13 | Recovery-link prefetch | Outlook SafeLinks-style scanners can consume the one-time recovery token on GET. Fix = `/auth/confirm` renders a "Continue" button that POSTs verification. Low priority (customers mostly consumer Gmail) — revisit if reset complaints appear. |
| 2.14 | Dangling pending orders | Failed Paystack init leaves an unpayable `pending` row (known caveat, PROGRESS 2026-06-09). Rate limiting (2.4) caps abuse; a reaper job can tidy later. |
| 2.15 | CSP `'unsafe-inline'` script-src | Accepted Next.js trade-off. Nonce-based CSP is a later hardening pass, not urgent. |

---

## 3. Tests still to run (next session)

1. **Lighthouse / PageSpeed** — PSI anonymous quota was exhausted on 10 June.
   Re-run: `curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://www.lumeneye.org/&strategy=mobile&category=performance&category=accessibility&category=seo&category=best-practices"`
   (or use a free Google API key to avoid the shared quota). Also test `/shop` and one PDP, not just `/`.
   Budgets: Perf ≥ 85, A11y ≥ 90, LCP < 2.5 s, TTI < 3.5 s on simulated 4G.
2. **Authenticated non-admin → admin probe** — sign in as a plain customer and hit
   `/admin`, `/admin/frames`, and POST an admin server action directly. Expect
   redirect to `/account` + the `requireAdmin` console.error. (Unauthenticated
   paths are already verified; the authenticated-non-admin layer was only
   code-reviewed, not live-tested.)
3. **Cross-user RLS spot-check** — as customer A, query `/api/orders/status?reference=<customer B's reference>`
   → expect 404/empty. Verify in staging with two seeded users.
4. **Full Paystack test-mode E2E in browser** — MoMo + card with Paystack test
   credentials on staging (couldn't be exercised with the seed admin —
   `admin@lumen.local` is rejected by Paystack; use a real-format email). Confirm
   webhook flips `pending → paid` and the callback page resolves.
5. **Rate-limit verification (after 2.4 lands)** — script 10 rapid failed sign-ins
   → expect 429/limit message on the 6th; confirm legit user on another IP unaffected.
6. **Password-change session revocation (after 2.5 lands)** — sign in on two
   browsers, change password in one, confirm the other's session dies on next request.
7. **Recovery-flow E2E** — request reset, click email link, set new password;
   then re-test the *expired/reused* link path (expect `/sign-in?error=link_invalid`).
8. **Email deliverability (after 2.9)** — send order-confirmation to a
   mail-tester.com address; check SPF/DKIM/DMARC pass + spam score.
9. **Real-device test** — Tecno Camon / Infinix Hot baseline on real 4G (CLAUDE.md
   requirement): browse → PDP → add to bag → checkout.
10. **Accessibility pass** — keyboard-only run of nav/drawer/checkout; screen-reader
    labels on cart badge + toasts (axe DevTools or `/design:accessibility-review`).
11. **`pnpm audit`** — run once now to baseline, before wiring into CI (2.8).

---

## 4. Web research to do before implementing

Each maps to a backlog item; verify against **current** docs (training data is stale):

1. **Upstash `@upstash/ratelimit`** (→2.4) — current free-tier limits, Vercel
   integration setup, sliding vs fixed window API, edge/server-action usage pattern.
2. **Supabase "Secure password change"** (→2.6) — exact setting name/location in
   2026 dashboard, the `reauthenticate()` + nonce flow, error code returned when
   reauth is required, free-tier availability.
3. **Supabase MFA (TOTP)** (→2.7) — free-tier enrolment API, how to require
   `aal2` for a role in RLS / in `getUser()` claims, enrolment UI pattern.
4. **`signOut({ scope: "others" })`** (→2.5) — confirm current `@supabase/supabase-js`
   v2 signature & behavior with `@supabase/ssr` cookie sessions.
5. **Vercel function regions + Supabase regions** (→2.3) — which regions each
   offers in 2026 (any Africa region yet?); how to set function region per-project
   on Hobby; whether Vercel Hobby allows region pinning.
6. **Next.js 16 caching for filtered listing pages** (→2.3) — current guidance:
   `'use cache'` directive status, PPR availability, ISR + `revalidatePath` with
   `searchParams`-driven pages; pick the idiomatic pattern.
7. **Paystack webhook config per environment** — dashboard steps for test vs live
   webhook URLs; confirm the live-mode IP allowlist/signature story hasn't changed.
8. **HSTS preload** (→2.12) — hstspreload.org requirements (`includeSubDomains`,
   `preload`, min max-age) and the irreversibility caveat before submitting.
9. **`pnpm audit` in CI** (→2.8) — current flags (`--prod`, `--audit-level`),
   Dependabot support for pnpm lockfiles in 2026, or `pnpm audit signatures`.
10. **Supabase auth rate-limit dashboard settings** (→2.11) — which limits are
    configurable on free tier in 2026 and sensible values when all traffic comes
    from server-side (shared Vercel egress IPs).
11. **Resend + domain DNS** (→2.9) — current SPF/DKIM/DMARC record set for
    `lumeneye.org`, and Supabase custom-SMTP-via-Resend setup (also unblocks
    Sprint-1 auth email items).

---

## 5. Suggested implementation order

1. `fix/broken-links` — 2.1 (smallest, most visible).
2. `feat/seo-basics` — 2.2 (robots, sitemap, OG image, metadata, JSON-LD).
3. `fix/auth-hardening` — 2.4 + 2.5 (+2.6 error handling), after research items 1–4.
4. Dashboard checklist session (no code): 2.6 toggle, 2.7 MFA, 2.9 Resend, 2.10 Sentry/UptimeRobot, 2.11 Supabase auth settings.
5. `perf/shop-caching` — 2.3, after research items 5–6 + the region check.
6. `chore/ci-audit` — 2.8.
