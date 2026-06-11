-- Lumen Eye Care — appointment requests (US-P1-01).
-- Public INSERT (no sign-in required — friction kills conversion); reads/writes
-- restricted to the record owner + admin. Mirrors the RLS + trigger pattern
-- from 20260608000002_content_catalogue.sql.

create table public.appointments (
  id               uuid        primary key default gen_random_uuid(),
  -- Nullable: request may come from an anonymous visitor.
  user_id          uuid        references auth.users (id) on delete set null,
  -- FK to the chosen clinic; snapshot the name so admin display survives
  -- a rename or soft-delete.
  clinic_id        uuid        references public.clinics (id) on delete set null,
  clinic_name      text        not null,
  service          text        not null default 'eye-test'
                               check (service in (
                                 'eye-test',
                                 'contact-lens',
                                 'glasses-fitting',
                                 'home-visit',
                                 'other'
                               )),
  name             text        not null,
  phone            text        not null,  -- E.164 (+233...)
  email            text        not null,
  preferred_date   date,                  -- optional; clinic confirms actual slot
  notes            text,
  status           text        not null default 'requested'
                               check (status in (
                                 'requested',
                                 'confirmed',
                                 'cancelled',
                                 'completed'
                               )),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;

-- Anyone (including anonymous visitors) can submit a request.
create policy "appointments insert public" on public.appointments
  for insert with check (true);

-- Signed-in customers can read their own requests (for US-P1-06 account view).
create policy "appointments select own" on public.appointments
  for select using (auth.uid() = user_id);

-- Admins can do everything.
create policy "appointments admin all" on public.appointments
  for all using (public.is_admin()) with check (public.is_admin());
