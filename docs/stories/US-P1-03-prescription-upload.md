# US-P1-03 — Prescription upload (customer uploads an existing Rx)

**Status:** Ready for build (product go-ahead given 2026-06-14). Target: a future session.
**Depends on:** signed-in account (US-P0-04 ✓), account portal (US-P1-06 ✓).
**Related:** US-P1-04 WhatsApp prescription (separate), US-P2-02 lens builder (separate).

---

## Context

A customer who already has a prescription from a **certified eye-care practitioner**
(optometrist/ophthalmologist) uploads a photo or PDF of it to their account, so it can be
used when ordering prescription lenses. This is **upload-only** — no OCR, no structured-field
parsing, no lens fulfilment. Lumen staff verify the document manually.

The infrastructure already exists from earlier sprints:
- **Private `prescriptions` Storage bucket** (`supabase/migrations/20260607000001_storage.sql`):
  10 MB cap, mime allowlist `image/jpeg|png|webp, application/pdf`, path convention
  `<user_id>/<file>`, owner + admin object policies, no public access.
- **`prescription_access_log` table** (`20260606000001_init.sql`): `actor_id`,
  `prescription_id`, `action ('upload'|'read'|'delete')`, `reason`, `created_at`; admin-read
  RLS; inserts via the secret-key client.
- **Feature flag** `LUMEN_PRESCRIPTION_UPLOAD_ENABLED` (`src/server/env.ts`), default off.

## ⚠️ Production-enablement gate (compliance, not code)

The **technical build can proceed now** behind the flag (dev/staging). But flipping the flag
**in production** processes sensitive health data and is gated on Charity's compliance
workstream, independent of the code:
- **Ghana DPC (Data Protection Commission) registration complete** — required to process
  personal/health data.
- **Lens-fulfilment partner named** (so a verified Rx actually leads somewhere).
- Consent UI (this story), retention policy, encryption at rest (Supabase default), and the
  audit log (this story) all in place.

Build behind the flag; do **not** enable in prod until the above is confirmed. Surface this
in the PR description as a `BLOCKED:`-style note on production rollout.

---

## Scope

**In:**
1. New `prescriptions` metadata table + migration (RLS on, owner + admin policies).
2. Consent-gated upload UI in the account portal (`/account/prescriptions`), flag-gated.
3. Server action: validate → upload to private bucket under `<user_id>/...` → insert row
   (`status='pending'`) → write `prescription_access_log` (`action='upload'`).
4. Customer list of their own prescriptions with status + a "view" that mints a **1-hour
   signed URL** and logs `action='read'`.
5. Admin review surface: list pending, view (signed URL + logged), mark
   `verified` / `rejected`.

**Out (v1):** OCR / auto-extraction (CLAUDE.md: no Rx OCR in v1), structured Rx field entry
(OD/OS SPH/CYL/axis/PD — the design mock shows these but defer to US-P2-02), sharing with an
external optician, WhatsApp delivery (US-P1-04), using the Rx in checkout/lens pricing.

---

## Data model — new migration `prescriptions`

```sql
create table public.prescriptions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  file_path        text not null,                 -- '<user_id>/<uuid>.<ext>' in the bucket
  original_name    text,                          -- as-uploaded filename (display only)
  mime_type        text not null,
  size_bytes       integer not null,
  status           text not null default 'pending'
                     check (status in ('pending','verified','rejected')),
  practitioner_name text,                          -- optional, customer-entered
  issued_on        date,                           -- optional; "under 12 months" guidance
  notes            text,                            -- customer note to staff
  review_notes     text,                            -- admin note (e.g. rejection reason)
  consent_at       timestamptz not null,            -- NOT NULL: no row without consent
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- + set_updated_at trigger (mirror other tables)
-- RLS on. Policies:
--   "prescriptions owner read"   for select using (auth.uid() = user_id)
--   "prescriptions owner insert" for insert with check (auth.uid() = user_id and consent_at is not null)
--   "prescriptions admin all"    for all using (public.is_admin()) with check (public.is_admin())
-- NOTE: no owner UPDATE policy — status is admin-only (don't let a customer self-verify).
-- Regenerate src/db/types.ts after `supabase db push`.
```

`prescription_access_log.prescription_id` now has a real referent (it's currently a loose
uuid). Optionally add the FK in this migration.

## Validation — `src/lib/prescription-schemas.ts` (+ tests)

- File: mime ∈ allowlist, size ≤ 5 MB (tighter than the 10 MB bucket guard, per design copy),
  non-empty.
- `issued_on`: optional; if present, not in the future and warn (not block) if > 12 months old.
- `practitioner_name` / `notes`: trimmed, length-capped.
- `consent`: must be `true` — server rejects otherwise (CLAUDE.md: "don't store
  prescriptions without consent").

## Server — `src/server/prescriptions.ts` (`server-only`)

- `createPrescription(formData)`: `requireUser()`; re-validate; upload the `File` to the
  **RLS client** under `<user.id>/<uuid>.<ext>` (owner-insert storage policy applies); insert
  the metadata row (RLS client); then **service-role** insert into `prescription_access_log`
  (`action='upload'`, `actor_id=user.id`). Flag-guard: if disabled, no-op / 404.
- `listOwnPrescriptions()`: RLS client, `.eq('user_id', user.id)` (owner-scope explicitly —
  see [[rls-admin-all-policy-needs-explicit-owner-filter]]).
- `getSignedUrl(prescriptionId, reason)`: load row (ownership/admin enforced), mint
  `createSignedUrl(file_path, 3600)` via the **secret-key** client (CLAUDE.md rule 7), then log
  `action='read'`. 1-hour expiry, every access logged.
- Admin: `listPrescriptions(status?)`, `setPrescriptionStatus(id, status, reviewNotes)`
  (`requireAdmin()`).

## UI

- **Customer** `src/app/(commerce)/account/prescriptions/` — flag-gated page (hide nav item +
  404 the route when off). Consent checkbox **must be ticked** to enable the file input/submit.
  Upload zone (drag/drop + choose file), then a list of their prescriptions with status pill
  + "View" (signed URL). Honest empty state with a "Book an eye test" link for those without
  an Rx. Wire the account portal **Prescriptions** nav item to this (currently "Soon").
- **Admin** `src/app/admin/prescriptions/` — pending queue + detail (view file via logged
  signed URL) + verify/reject with a note. `requireAdmin()` in every page/action.

## Security checklist (CLAUDE.md rules 5, 6, 7, 10)

- [ ] Private bucket only; **never** a public URL — 1-hour signed URLs per access.
- [ ] Every signed-URL generation logged to `prescription_access_log` (actor + action + time).
- [ ] Consent required + stored (`consent_at`); no row without it.
- [ ] RLS on the new table; owner sees own, admin sees all; no owner self-UPDATE of `status`.
- [ ] Secret key only in `src/server/*` (`import 'server-only'`); signed URLs server-side.
- [ ] No PII in logs; flag stays **off in prod** until the compliance gate clears.

## Acceptance criteria

1. Flag off → no nav item, route 404s, action no-ops.
2. Flag on + signed in → upload UI; submit disabled until consent ticked.
3. Valid upload → file lands in `prescriptions/<user_id>/...`, row `status='pending'`, an
   `upload` audit row written; customer sees it listed.
4. Invalid type/size/oversize → rejected with a clear message; nothing stored.
5. "View" mints a working ~1-hour URL and writes a `read` audit row; URL dead after expiry.
6. Another signed-in user **cannot** read or list someone else's prescription (RLS).
7. Admin sees pending queue, views (logged), marks verified/rejected with a note; customer
   sees the updated status.
8. typecheck / lint / test (+ schema tests) / build green; live e2e behind `SUPABASE_LINKED`.

## Verification

Wire worktree env + `supabase db push` the new migration + regenerate types. With the flag on:
upload as a customer, confirm the storage object + row + audit log, confirm signed-URL expiry,
confirm cross-user RLS denial, run the admin verify flow. Spot-check light/dark.
