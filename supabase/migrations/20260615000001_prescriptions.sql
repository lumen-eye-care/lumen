-- Lumen Eye Care — prescription metadata (US-P1-03).
-- Customers upload a photo/PDF of an existing Rx (from a certified practitioner)
-- to their account; staff verify it manually. Upload-only — no OCR, no structured
-- Rx fields, no lens fulfilment (those are US-P2-02).
--
-- The private `prescriptions` Storage bucket + owner/admin object policies already
-- exist (20260607000001_storage.sql); the file bytes live there. This table holds
-- the per-document metadata + verification status. RLS mirrors the owner+admin
-- pattern from 20260611000001_appointments.sql.
--
-- Compliance: build proceeds behind LUMEN_PRESCRIPTION_UPLOAD_ENABLED (default
-- off). Production flag-flip is gated on Charity's DPC registration + a named
-- lens-fulfilment partner — independent of this code.

create table public.prescriptions (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.users (id) on delete cascade,
  -- '<user_id>/<uuid>.<ext>' object key in the private `prescriptions` bucket.
  file_path         text        not null,
  original_name     text,                  -- as-uploaded filename (display only)
  mime_type         text        not null,
  size_bytes        integer     not null,
  status            text        not null default 'pending'
                                check (status in ('pending', 'verified', 'rejected')),
  practitioner_name text,                  -- optional, customer-entered
  issued_on         date,                  -- optional; "under 12 months" guidance
  notes             text,                  -- customer note to staff
  review_notes      text,                  -- admin note (e.g. rejection reason)
  -- NOT NULL: no row may exist without recorded consent
  -- ("don't store prescriptions without consent").
  consent_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index prescriptions_user_idx on public.prescriptions (user_id);

create trigger prescriptions_set_updated_at
  before update on public.prescriptions
  for each row execute function public.set_updated_at();

alter table public.prescriptions enable row level security;

-- Owners read their own prescriptions.
create policy "prescriptions owner read" on public.prescriptions
  for select using (auth.uid() = user_id);

-- Owners create their own, and only with consent recorded.
create policy "prescriptions owner insert" on public.prescriptions
  for insert with check (auth.uid() = user_id and consent_at is not null);

-- NO owner UPDATE policy: status is admin-only — a customer must not self-verify.

-- Admins can do everything (review queue, verify/reject).
create policy "prescriptions admin all" on public.prescriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- The access log's prescription_id now has a real referent. Keep it nullable +
-- set-null on delete so deleting a prescription doesn't erase its audit trail.
alter table public.prescription_access_log
  add constraint prescription_access_log_prescription_id_fkey
  foreign key (prescription_id)
  references public.prescriptions (id) on delete set null;
