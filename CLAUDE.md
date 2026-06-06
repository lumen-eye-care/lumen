# CLAUDE.md — Lumen Eye Care

**For Claude Code working in this repo. Read this first, every time.**

## What this is

Lumen Eye Care is a Ghana-based DTC eyewear brand launching its first frames collection in the **2nd week of July 2026 (6–12 July)**. This repo is the v1 launch website. Single founder client (Charity Adomah Sasu). Two-developer build (Bryan & Etornam). Personal-favor budget (GHS 3,300 covering only external technical resources; dev labor contributed).

The full specification lives in `docs/Lumen_Handoff_v1.docx` (committed at handover). This file is the always-in-context summary.

## Quick commands

```bash
pnpm dev              # local dev server on :3000
pnpm build            # production build
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint .
pnpm test             # vitest run
pnpm test:e2e         # playwright test
pnpm seed             # populate dev DB with mock frames + clinics
pnpm supabase db push # apply migrations (staging / prod)
```

## Tech stack

Next.js 14 App Router · TypeScript strict · Tailwind + CSS variables · Supabase (Postgres + Auth + Storage) · Paystack (MoMo + card) · Vercel (Hobby) · Resend (3K/mo free).

**No SMS in v1.** No phone OTP. No AR try-on SDK. No prescription OCR. See "Out of Scope" in the Handoff doc, Section 19.

## Architecture in one paragraph

Server Components render catalogue + content. Client Components handle cart, lens builder, try-on, checkout step controls. Server Actions and Route Handlers gate writes via Supabase auth + RLS. Paystack via REST + webhook. Resend for transactional email. Two Supabase Storage buckets: `frames` (public) and `prescriptions` (private, signed URLs, audit logged).

## Folder structure

```
src/
  app/               # Next.js App Router routes
    (marketing)/     # public: home, shop, frame-detail, clinics, journal
    (auth)/          # sign-in, sign-up, reset-password
    (commerce)/      # checkout, account, account/orders
    admin/           # admin role only
    api/             # route handlers (Paystack webhook, etc.)
  components/        # shared React components (atoms, molecules, organisms)
  lib/               # pure utilities (formatters, validators, safe-redirect)
  server/            # server-only code: db access, paystack, resend, auth-guards
  db/                # Supabase migrations + generated types
  styles/            # tailwind config, global CSS
```

## Brand tokens (mirror prototype's styles.css)

```css
--lumen-ink:    #0A1F35   /* primary text */
--lumen-blue:   #0F4C81   /* primary brand */
--lumen-sage:   #3D6B5C   /* accent green */
--lumen-warm:   #D97757   /* accent terracotta */
--lumen-cream:  #FAF7F2   /* background */

--r-sm: 8px;  --r-md: 12px;  --r-lg: 16px;  --r-xl: 24px;
```

Fonts: **Instrument Serif** (display, italic emphasis), **Geist** (body, 300–700). Both from Google Fonts.

Spacing scale: `4, 8, 12, 16, 24, 32, 48, 64, 80, 120` (px).

## Code conventions

- **TypeScript strict.** No `any`. No `@ts-ignore` without a one-line comment explaining why.
- **File names** are kebab-case (`product-card.tsx`); **components** PascalCase (`ProductCard`); **variables/functions** camelCase.
- **Imports** are absolute from `src/` (`tsconfig.json` `paths` configured).
- **Commits** follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- **Branches**: `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.
- **PR descriptions** reference the user story ID (e.g., `Implements US-P0-04 (sign up and sign in)`).
- **Money** is stored as integer pesewa (1 GHS = 100 pesewa), formatted with `Intl.NumberFormat('en-GH', { currency: 'GHS' })` on display.
- **Phone numbers** stored as E.164 (`+233...`); accept both `0XXX` and `+233XXX` on input via `libphonenumber-js`.

## Security rules — non-negotiable

**These are the rules that protect Lumen and Charity from real-world harm. Don't skip any.**

### 1. CORS — no wildcards, ever

Next.js App Router is same-origin by default; that's the safe state. **Never set `Access-Control-Allow-Origin: '*'` in any route handler, middleware, or `next.config.js`.** If a route genuinely needs cross-origin access (none should in v1), allowlist explicitly:

```ts
// src/server/cors.ts
const ALLOWED_ORIGINS = [
  'https://lumenframes.com',
  'https://lumen-staging.vercel.app',
  'http://localhost:3000',
];
export function isAllowedOrigin(origin: string | null) {
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}
```

Paystack webhook is server-to-server (no CORS involved). Internal API routes are same-origin (no CORS needed).

### 2. Open-redirect prevention — every redirect through `safeRedirect()`

Any `?redirect=`, `?next=`, `?callback=` query param is an open-redirect surface. The rule is: **never `Response.redirect()` to a user-supplied URL without `safeRedirect()` first.**

```ts
// src/lib/safe-redirect.ts
export function safeRedirect(input: string | null, fallback = '/') {
  if (!input) return fallback;
  // must be a relative path; reject protocol-relative (//evil) and absolute URLs
  if (!input.startsWith('/') || input.startsWith('//')) return fallback;
  // reject javascript:, data:, etc. (defensive — the startsWith check above handles it,
  // but explicit doesn't hurt)
  if (/^\s*(javascript|data|vbscript):/i.test(input)) return fallback;
  return input;
}
```

Use everywhere:

```ts
const dest = safeRedirect(searchParams.get('redirect'));
return Response.redirect(new URL(dest, request.url));
```

### 3. Admin authorization — three-layer defense

Middleware alone isn't enough. **Every admin-capable handler verifies role itself**, and RLS in Postgres is the third layer. Read the role from `app_metadata.role` (server-controlled), **never** from `user_metadata` (user-editable, untrustworthy) or any client input.

```ts
// src/server/auth-guards.ts
import 'server-only';
import { createServerClient } from '@/server/supabase';
import { redirect } from 'next/navigation';

export async function requireUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const role = user.app_metadata?.role || 'customer';
  if (role !== 'admin') {
    console.error('Non-admin attempted admin action', { userId: user.id });
    redirect('/account');
  }
  return user;
}
```

Every admin server action / API route handler starts with one line:

```ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin();   // ← non-negotiable, before any DB work
  // ...
}
```

Three layers, in order: (a) middleware on `/admin/*` paths (fast denial), (b) `requireAdmin()` in every handler (defense in depth), (c) Postgres RLS policies (last line of defense — even a bypassed handler can't read other people's rows).

### 4. Paystack webhook — verify signature on raw body

The `x-paystack-signature` header is HMAC SHA-512 of the **raw request body** (not the parsed JSON) using `PAYSTACK_SECRET_KEY`. **Read the raw body first, verify, then parse.** Idempotent processing keyed on `event.id` (Paystack retries on non-200).

```ts
import crypto from 'crypto';
const raw = await req.text();
const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
  .update(raw).digest('hex');
if (hash !== req.headers.get('x-paystack-signature')) {
  return new Response('Unauthorized', { status: 401 });
}
const event = JSON.parse(raw);
// then check event.id against webhook_events table for idempotency
```

### 5. Service role key — server-only, `import 'server-only'`

`SUPABASE_SERVICE_ROLE_KEY` lives in `.env.local` (gitignored) and Vercel server env vars. Anything that uses it lives in `src/server/` with `import 'server-only'` at the top of the module — Next.js will hard-error if any client code imports it.

```ts
// src/server/supabase-admin.ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
```

If the key leaks: **regenerate immediately** in Supabase dashboard. Don't try to scrub git history first — the damage is the leak window.

### 6. Row Level Security — ON by default, every table

Every Supabase migration that creates a new table also enables RLS and adds policies. **No table ships without RLS on.** Default policies: customers see their own rows; admins see all (via `app_metadata.role` claim in JWT).

```sql
alter table public.orders enable row level security;

create policy "own orders" on public.orders
  for all using (auth.uid() = user_id);

create policy "admin orders" on public.orders
  for all using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

### 7. Signed URLs for prescriptions — short expiry, audit log

Prescriptions live in a **private** Supabase Storage bucket. Generate signed URLs with **1-hour expiry** on each access. Log every signed-URL generation to `prescription_access_log` with actor + timestamp + reason.

```ts
const { data } = await supabaseAdmin.storage
  .from('prescriptions')
  .createSignedUrl(path, 3600); // 1 hour
await logAccess({ userId, prescriptionId, action: 'read', timestamp: new Date() });
```

### 8. Cookies — secure flags

All session cookies set with `Secure` (HTTPS only), `HttpOnly` (no JavaScript access), `SameSite=Lax` (CSRF mitigation). Supabase Auth sets these by default — **don't override**. If you need a custom cookie, match the defaults.

### 9. Content Security Policy headers — defense against XSS

Add CSP headers in `middleware.ts` to limit what scripts/fonts/images can load. Strict default:

```ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.paystack.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  connect-src 'self' https://*.supabase.co https://api.paystack.co;
  frame-src https://checkout.paystack.com;
`.replace(/\s+/g, ' ').trim();
```

Tune as needed for Paystack hosted-card form + Vercel analytics. Don't widen without reviewing what you're enabling.

### 10. Secrets and PII — never to Claude Code, never to logs

- Don't paste Charity's real customer data (orders, prescriptions, names, phones) into Claude Code prompts. Use seed data or anonymised samples.
- Don't `console.log` PII in production. Wrap with `if (process.env.NODE_ENV !== 'production')` if needed for debugging.
- Don't commit `.env.local`. The pre-commit secret scan (when we add it in Sprint 2) will block this anyway.

---

## Important rules (do these)

- **Verify Paystack webhook signature** on every event. (See Security rule 4.)
- **Use the service role key only on the server.** (See Security rule 5.)
- **Sign URLs for prescriptions.** (See Security rule 7.)
- **Idempotency on checkout.** `POST /api/checkout/initiate` accepts an `Idempotency-Key` header; reject duplicate keys within 24 hours.
- **Use feature flags for risky features.** `LUMEN_PRESCRIPTION_UPLOAD_ENABLED` defaults to false until the lens-fulfillment partner is named and DPC registration is complete.
- **Run Lighthouse on every PR.** GitHub Actions runs Lighthouse mobile audit; fail the build if Performance < 80 or Accessibility < 90.
- **Test on real mid-range Android.** Tecno Camon / Infinix Hot baseline.
- **Use the correct Ghana payment-rail names.** MTN MoMo / **Telecel Cash** (not "Vodafone Cash") / **AT Money** (not "AirtelTigo Money").

## Important rules (don't do these)

- **Don't build anything not in the user stories.** See Handoff Section 19.
- **Don't store unhashed passwords anywhere.** Supabase Auth handles password hashing.
- **Don't store prescriptions without consent.** Customer must explicitly opt in on the upload screen.
- **Don't require postal codes** on address forms. Ghana postal codes are unreliable.
- **Don't bypass RLS.** When you want to do `auth.uid()` checks in code, write an RLS policy instead.
- **Don't merge with failing tests.** Even on "small" changes.
- **Don't disable the focus outline.** Accessibility regression that costs nothing to keep.
- **Don't use `any` to silence TypeScript.** Use `unknown` + type-narrowing.

## Common gotchas in this stack

- **Next.js App Router caching.** Server Components are cached by default. Use `export const dynamic = 'force-dynamic'` on routes that must always run server-side (e.g., `/account/orders`). Use `revalidatePath('/shop')` after admin updates.
- **Supabase RLS empty queries.** If a query returns empty unexpectedly, check RLS policies first — service role bypasses them, anon key doesn't.
- **Paystack sandbox vs live.** Webhook URLs and keys differ; set per environment in Vercel project settings.
- **Resend domain verification.** Add SPF, DKIM, DMARC records to the chosen domain; without these, emails go to spam.
- **Vercel function timeouts.** Hobby tier has a 10-second timeout. Paystack webhook handler should be fast.
- **localStorage in SSR.** Access inside `useEffect` only to avoid hydration mismatches.

## User stories (cheat sheet)

**P0 (Tier 1, must ship):** US-P0-01 browse · US-P0-02 view frame · US-P0-03 add to cart · US-P0-04 sign up/in · US-P0-05 MoMo checkout · US-P0-06 card checkout · US-P0-07 COD checkout · US-P0-08 view orders · US-P0-09 see clinics.

**P1 (Tier 2, standard):** US-P1-01 request appointment · US-P1-02 lens quiz · US-P1-03 prescription upload (flag-gated) · US-P1-04 WhatsApp prescription · US-P1-05 order tracking · US-P1-06 account dashboard · US-P1-07 basic admin.

**P2 (Tier 3, stretch — at Week-5 checkpoint):** US-P2-01 virtual try-on · US-P2-02 lens builder · US-P2-03 journal · US-P2-04 full admin.

Full acceptance criteria in `docs/Lumen_Handoff_v1.docx` Section 6. Flow diagrams in `docs/app-flow.md`.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
LUMEN_PRESCRIPTION_UPLOAD_ENABLED=false
ADMIN_EMAIL_DOMAINS=
```

Production values live in Vercel project settings. **Never commit `.env.local`.**

## Performance budgets (hard limits)

- Initial JS bundle: **< 200 KB gzipped**
- LCP: **< 2.5s** on simulated 4G
- TTI: **< 3.5s** on simulated 4G
- API p50: **< 300ms** / p95: **< 800ms**
- Per-image size: **< 100 KB**
- Lighthouse mobile: **Performance ≥ 85, Accessibility ≥ 90**

## When stuck

- **Product or scope question** → WhatsApp Charity (+233 24 562 8432).
- **Technical blocker** → flag in PR description with `BLOCKED:` prefix.
- **Design ambiguity** → stay faithful to the prototype in `Clients/Lumen/Designs/`.
- **Security question / something feels off** → stop, ask before continuing. Don't ship security shortcuts.
- **Out-of-scope creep** → check Handoff Section 19. If unsure, ask before building.

## Open items to track (as of 5 June 2026)

- M1 payment received 5 June; kick-off call due by Wed 10 June per Commercial Terms.
- Lens-fulfillment partner not yet named — prescription upload stays behind feature flag.
- Business registration (RGD + GRA TIN) expected 3rd week of June; Paystack Registered upgrade and card processing depend on it.
- DPC registration is Charity's workstream; technical compliance (encryption, signed URLs, audit log, consent UI, retention) is ours.
- Paystack category eligibility for card processing — verify on Sprint 0 Day 2.
- Requirements Checklist sign-off pending from Charity.

## File compass

```
docs/
  Lumen_Handoff_v1.docx           # full spec — read for any non-obvious question
  Lumen_Proposal_v3.docx          # signed contract — read for commercial terms
  app-flow.md                     # Mermaid flow diagrams for every user journey
  brief.md                         # client context
src/
  app/                             # routes
  components/                      # shared UI
  lib/                             # pure utilities (formatters, validators, safe-redirect)
  server/                          # server-only (db, paystack, resend, auth-guards)
  db/migrations/                   # Supabase migrations
.github/workflows/                 # CI: typecheck + lint + test + lighthouse
```

---

**Last updated:** 5 June 2026
**Maintainer:** Bryan & Etornam (+233 55 884 2505 / +233 24 562 8432)
**Changelog vs v1:** Added Security rules section (10 rules covering CORS, open redirect, admin authorization, Paystack signature verification, service-role-key handling, RLS, signed URLs, secure cookies, CSP, PII handling). Bumped Open Items to 5 June 2026 reflecting M1 received.
