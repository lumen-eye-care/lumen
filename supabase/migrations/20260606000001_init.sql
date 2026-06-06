-- Lumen Eye Care — initial schema.
-- Establishes the RLS-on-by-default pattern (CLAUDE.md security rule 6): every
-- table enables RLS and ships with an owner policy + an admin policy. Admin is
-- read from the JWT app_metadata.role claim (server-controlled), never from
-- user-editable metadata or client input.
--
-- Remaining tables (addresses, clinics, appointments, prescriptions) follow the
-- same pattern in Sprint 1/2 migrations.

create extension if not exists pgcrypto;

-- Shared helper: keep updated_at fresh on mutation.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Convenience: is the current JWT an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- users — mirrors auth.users, holds app profile + role.
-- ---------------------------------------------------------------------------
create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text,
  phone       text, -- E.164 (+233...)
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;

create policy "users read own" on public.users
  for select using (auth.uid() = id);
create policy "users update own" on public.users
  for update using (auth.uid() = id);
create policy "users admin all" on public.users
  for all using (public.is_admin()) with check (public.is_admin());

-- Auto-create a public.users row when an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- frames — product catalogue. Public read; admin write.
-- ---------------------------------------------------------------------------
create table public.frames (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  shape        text,
  type         text check (type in ('optical', 'sun')),
  price_ghs    integer not null check (price_ghs >= 0), -- integer pesewa
  colors       jsonb not null default '[]'::jsonb,
  badge        text,
  photo_urls   text[] not null default '{}',
  description  text,
  materials    jsonb not null default '{}'::jsonb,
  stock        integer not null default 0 check (stock >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger frames_set_updated_at
  before update on public.frames
  for each row execute function public.set_updated_at();

alter table public.frames enable row level security;

create policy "frames public read" on public.frames
  for select using (true);
create policy "frames admin write" on public.frames
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders — owner read/write; admin all.
-- ---------------------------------------------------------------------------
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.users (id) on delete set null,
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'failed',
                                          'failed_timeout', 'cod_pending',
                                          'cod_collected', 'shipped',
                                          'delivered', 'refunded')),
  total_ghs           integer not null check (total_ghs >= 0), -- integer pesewa
  currency            text not null default 'GHS',
  payment_method      text check (payment_method in ('momo', 'card', 'cod')),
  payment_reference   text unique,
  delivery_type       text,
  e_levy_amount       integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create index orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;

create policy "orders read own" on public.orders
  for select using (auth.uid() = user_id);
create policy "orders insert own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders admin all" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_items — visible via owning order.
-- ---------------------------------------------------------------------------
create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  frame_id        uuid references public.frames (id) on delete set null,
  lens_config     jsonb,
  color_selected  text,
  price_ghs       integer not null check (price_ghs >= 0), -- integer pesewa
  quantity        integer not null default 1 check (quantity > 0),
  created_at      timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy "order_items read own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );
create policy "order_items admin all" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- webhook_events — Paystack idempotency ledger. Service-role only:
-- RLS is ON with no policies, so anon/auth clients see nothing; the service
-- role (webhook handler) bypasses RLS.
-- ---------------------------------------------------------------------------
create table public.webhook_events (
  id                  uuid primary key default gen_random_uuid(),
  paystack_event_id   text not null unique, -- idempotency key
  event               text not null,
  payload             jsonb not null,
  processed_at        timestamptz not null default now()
);

alter table public.webhook_events enable row level security;

-- ---------------------------------------------------------------------------
-- prescription_access_log — DPA audit trail. Admin read; inserts via service role.
-- ---------------------------------------------------------------------------
create table public.prescription_access_log (
  id               uuid primary key default gen_random_uuid(),
  actor_id         uuid references public.users (id) on delete set null,
  prescription_id  uuid,
  action           text not null check (action in ('upload', 'read', 'delete')),
  reason           text,
  created_at       timestamptz not null default now()
);

create index prescription_access_log_prescription_idx
  on public.prescription_access_log (prescription_id);

alter table public.prescription_access_log enable row level security;

create policy "access_log admin read" on public.prescription_access_log
  for select using (public.is_admin());
