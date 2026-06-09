# Observability runbook — Lumen v1

Lean monitoring for the live store. The **code** ships in the repo; the items
below are **dashboard/deploy steps** (like the Sprint-1 auth-dashboard checklist).
Proportionate by design: Sentry free tier (5K events/mo), Vercel default analytics
(no GA4), one external uptime monitor.

## What's in code already
- **Sentry** — `instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`,
  `instrumentation-client.ts`, all sharing `src/lib/sentry-scrub.ts` (PII scrub,
  rule 10). Wrapped in `next.config.ts` via `withSentryConfig` with
  `tunnelRoute: '/monitoring'` (same-origin → no CSP widening) and source maps
  deleted after upload (no public source disclosure).
- **Payment-path captures** — tagged `area:paystack-webhook` and `area:checkout`
  in the webhook + checkout-initiate handlers (order id + codes only, never the
  raw payload).
- **Vercel Analytics + Speed Insights** — `<Analytics/>` + `<SpeedInsights/>` in
  `src/app/layout.tsx`.
- **`/api/health`** — app + Supabase probe; 503 when the DB is unreachable.

## Environment variables
| Var | Where | Secret? |
|-----|-------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel (all envs) + `.env.local` | No (public DSN) |
| `SENTRY_AUTH_TOKEN` | Vercel **build** env only | **Yes** — treat like the Supabase secret key |
| `SENTRY_ORG`, `SENTRY_PROJECT` | Vercel build env | No |

Vercel Analytics + Speed Insights need **no** env vars.

## Deploy checklist
1. **Create the Sentry project** (platform: Next.js). Copy the DSN → `NEXT_PUBLIC_SENTRY_DSN`.
2. **Create a Sentry auth token** (project → source maps) with `project:releases` +
   `org:read` scope → set `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` in
   the Vercel **build** environment. (Without it the build still succeeds; source
   maps just aren't uploaded.)
3. **Enable Vercel Analytics + Speed Insights** for the project (dashboard → the
   Analytics / Speed Insights tabs → Enable). Free on Hobby; auto-pauses past the
   allotment.
4. **Payment-path alert** (highest-value alert for a live store):
   - Sentry → **Alerts → Create Alert → Issues**.
   - Condition: *an event is captured*.
   - Filter: **tag `area` is one of `paystack-webhook`, `checkout`** AND
     **`environment` equals `production`**.
   - Action: **email me** (add your address as the owner).
   - This fires on webhook fulfilment failures, charge mismatches, and checkout
     Paystack-init errors.
5. **UptimeRobot** (free: 50 monitors, 5-min interval, email alerts). Add two
   HTTP(s) monitors:
   - `https://<prod-domain>/` — expects 200.
   - `https://<prod-domain>/api/health` — add a **keyword monitor** that alerts
     when the response does **not** contain `"app":"ok"` (so a 200-with-degraded-DB
     still alerts; the endpoint also returns 503 when the DB is down).
   - Set the alert contact to your email; 5-min interval is fine for launch.

## Tuning notes
- **Free-tier quota:** tracing is off (`tracesSampleRate: 0`) and Replay is not
  enabled — errors only. The 401 webhook signature failure is intentionally **not**
  captured (attacker-driven noise). `environment` separates staging from prod so
  staging noise doesn't burn prod-relevant quota.
- **CSP:** do **not** add a Sentry domain to `connect-src` in `src/proxy.ts` — the
  tunnel keeps events same-origin. If you ever enable Session Replay or move to the
  EU region (`*.de.sentry.io`), revisit the CSP then.
- **PII:** all scrubbing lives in `src/lib/sentry-scrub.ts` (unit-tested). If you
  add new captures, pass only IDs + codes — never customer fields.
