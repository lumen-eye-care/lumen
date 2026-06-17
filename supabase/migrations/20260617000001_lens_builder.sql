-- Lumen Eye Care — lens builder (US-P2-02).
-- Turns the PDP's static "lens builder coming soon" placeholder into a real,
-- server-priced part of the order: customer picks a lens type + add-ons + a
-- prescription path, and the cost is re-derived server-side at checkout.
--
-- These options were hardcoded in docs/design/frame-detail.jsx (lensOptions /
-- addonOptions @48-62) — now a DB-driven, admin-manageable GLOBAL catalogue
-- (one menu for all frames; no per-frame lens variants). Money is integer
-- pesewa throughout (100 pesewa = GHS 1), matching frames.price_ghs.
--
-- Security rule 6: RLS ON + public-read / admin-write on both catalogues.

-- ---------------------------------------------------------------------------
-- lens_types  — the primary lens choice (single vision, varifocal, …).
-- Exactly one is selected per built line. price_ghs is the surcharge over the
-- frame (0 for the included options).
-- ---------------------------------------------------------------------------
create table public.lens_types (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null unique,           -- 'single', 'varifocal', 'reader', 'blue'
  name         text        not null,                  -- 'Single vision'
  description  text,                                  -- short helper line shown in the builder
  price_ghs    integer     not null default 0 check (price_ghs >= 0),  -- pesewa surcharge
  badge        text,                                  -- 'Most popular', 'Recommended' (optional)
  is_active    boolean     not null default true,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger lens_types_set_updated_at
  before update on public.lens_types
  for each row execute function public.set_updated_at();

alter table public.lens_types enable row level security;

create policy "lens_types public read" on public.lens_types
  for select using (true);
create policy "lens_types admin write" on public.lens_types
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- lens_addons  — zero-or-more coatings / upgrades per built line.
-- `included` flags the always-on options shown at price 0 with an "Included"
-- badge (anti-reflective, scratch-resistant, UV400).
-- ---------------------------------------------------------------------------
create table public.lens_addons (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        not null unique,           -- 'antireflective', 'transition', …
  name         text        not null,
  description  text,
  price_ghs    integer     not null default 0 check (price_ghs >= 0),  -- pesewa surcharge
  included     boolean     not null default false,    -- always-on (price 0, "Included" badge)
  is_active    boolean     not null default true,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger lens_addons_set_updated_at
  before update on public.lens_addons
  for each row execute function public.set_updated_at();

alter table public.lens_addons enable row level security;

create policy "lens_addons public read" on public.lens_addons
  for select using (true);
create policy "lens_addons admin write" on public.lens_addons
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_items (alter) — persist the lens surcharge separately from the frame.
-- price_ghs stays the FRAME unit price; lens_price_ghs is the per-unit lens
-- surcharge (type + add-ons). Order total = Σ (price_ghs + lens_price_ghs) × qty,
-- which keeps the Paystack exact-amount anti-tamper check intact. The human
-- readable breakdown (lens type, add-on names, Rx method) goes in the existing
-- lens_config jsonb column.
-- ---------------------------------------------------------------------------
alter table public.order_items
  add column lens_price_ghs integer not null default 0 check (lens_price_ghs >= 0);

-- ---------------------------------------------------------------------------
-- prescriptions (alter) — support MANUAL Rx entry alongside file upload.
-- DPC green light received (2026-06-17); upload + manual capture health data and
-- still ship behind LUMEN_PRESCRIPTION_UPLOAD_ENABLED (prod flag-flip is a
-- separate deploy step). Manual rows carry no file, so the file-metadata columns
-- become nullable, guarded by a shape CHECK so each source stays well-formed.
-- ---------------------------------------------------------------------------
alter table public.prescriptions
  alter column file_path  drop not null,
  alter column mime_type  drop not null,
  alter column size_bytes drop not null,
  add column source    text  not null default 'upload'
                             check (source in ('upload', 'manual')),
  add column rx_values jsonb;  -- { right: {sph,cyl,axis,add}, left: {...}, pd } — health data

-- An upload must carry its file metadata; a manual entry must carry Rx values.
alter table public.prescriptions
  add constraint prescriptions_source_shape check (
    (source = 'upload' and file_path is not null and mime_type is not null)
    or (source = 'manual' and rx_values is not null)
  );
