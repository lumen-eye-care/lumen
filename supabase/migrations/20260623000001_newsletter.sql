-- Lumen Eye Care — newsletter signups (footer email capture).
-- Anonymous INSERT only (anyone can subscribe — no sign-in); reads restricted
-- to admins. Append-only, so no updated_at column / trigger. Mirrors the RLS
-- pattern from 20260611000001_appointments.sql.

create table public.newsletter_signups (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  -- Where the signup came from (footer today; room for other surfaces later).
  source      text        not null default 'footer',
  created_at  timestamptz not null default now()
);

-- Case-insensitive uniqueness so "A@x.com" and "a@x.com" don't both land.
create unique index newsletter_signups_email_key
  on public.newsletter_signups (lower(email));

alter table public.newsletter_signups enable row level security;

-- Anyone (including anonymous visitors) can subscribe.
create policy "newsletter insert public" on public.newsletter_signups
  for insert with check (true);

-- Only admins can read / manage the list.
create policy "newsletter admin all" on public.newsletter_signups
  for all using (public.is_admin()) with check (public.is_admin());
