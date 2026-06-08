-- Lumen Eye Care — content catalogue (Sprint 1 follow-up).
-- Makes the app data-driven; an admin can manage all four content areas
-- without code changes (CLAUDE.md requirement; US-P0-09 clinics, US-P2-03 journal).
--
-- Tables added / altered:
--   frame_categories  — lookup replacing the hardcoded CHECK enum on frames.type
--   frames (altered)  — adds category_id, gender, material; drops old type column
--   clinics           — US-P0-09; was a hardcoded JS array in docs/design/clinics.jsx
--   journal_categories — lookup for journal_posts.category_id
--   journal_posts     — US-P2-03; was a hardcoded JS array in docs/design/journal.jsx
--
-- Security rule 6: RLS ON + public-read / admin-write policies on every table.
-- Lens-builder options (lens_types, lens_addons, rx_options) remain hardcoded in
-- docs/design/frame-detail.jsx — deferred to the US-P2-02 Lens Builder migration.

-- ---------------------------------------------------------------------------
-- frame_categories
-- Replaces the frames.type CHECK enum ('optical','sun'). Each row is a shop
-- collection tab; adding "contacts" or future lines is a DB insert, not a
-- code change. hero_title / hero_subtitle hold the per-tab shop copy that
-- is currently hardcoded in docs/design/shop.jsx:110-121.
-- ---------------------------------------------------------------------------
create table public.frame_categories (
  id             uuid        primary key default gen_random_uuid(),
  slug           text        not null unique,   -- 'optical', 'sun', 'contacts'
  name           text        not null,          -- 'Optical', 'Sunglasses', 'Contact lenses'
  description    text,
  hero_title     text,        -- h1 for the shop page when this category is active
  hero_subtitle  text,        -- sub-copy under the h1
  sort_order     integer     not null default 0,
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger frame_categories_set_updated_at
  before update on public.frame_categories
  for each row execute function public.set_updated_at();

alter table public.frame_categories enable row level security;

create policy "frame_categories public read" on public.frame_categories
  for select using (true);
create policy "frame_categories admin write" on public.frame_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- frames (alter)
-- Adds three editable columns used by the shop's filter sidebar
-- (docs/design/shop.jsx:141-185) and drops the old hardcoded type enum.
--
--   category_id — FK to frame_categories; nullable until rows are back-filled.
--   gender      — shop sidebar "Gender" filter (men / women / unisex).
--   material    — top-level filterable class ('Italian Acetate', 'Japanese
--                 Titanium', 'Metal'). Distinct from `materials jsonb`, which
--                 holds the full spec detail shown on the PDP.
--
-- Known shape values (editable free text): round, square, cateye, aviator,
--   oval, hex — listed here for seed/admin reference.
-- Known badge values (editable free text): BESTSELLER, NEW, LIMITED.
-- ---------------------------------------------------------------------------
alter table public.frames
  add column category_id  uuid references public.frame_categories (id),
  add column gender       text check (gender in ('men', 'women', 'unisex')),
  add column material     text;

-- Drop the old CHECK enum — superseded by category_id.
-- Constraint was auto-named frames_type_check by Postgres.
alter table public.frames drop constraint if exists frames_type_check;
alter table public.frames drop column  if exists type;

-- ---------------------------------------------------------------------------
-- clinics  (US-P0-09)
-- opening_hours is a jsonb map keyed by lowercase day abbreviation:
--   { "mon": { "open": "08:00", "close": "19:00", "closed": false }, ... }
-- services is a plain text array of service names shown as chips in the UI.
-- ---------------------------------------------------------------------------
create table public.clinics (
  id                  uuid        primary key default gen_random_uuid(),
  slug                text        not null unique,
  name                text        not null,
  address             text        not null,
  phone               text,                          -- E.164 (+233...)
  whatsapp            text,                          -- E.164 (+233...) for WA deep-link
  optometrist_count   integer     not null default 0,
  services            text[]      not null default '{}',
  opening_hours       jsonb       not null default '{}', -- per-day schedule (see shape above)
  is_flagship         boolean     not null default false,
  is_active           boolean     not null default true,
  latitude            numeric(9,6),                  -- map pin; Ghana ~5-10 °N, 0-3 °W
  longitude           numeric(9,6),
  sort_order          integer     not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger clinics_set_updated_at
  before update on public.clinics
  for each row execute function public.set_updated_at();

alter table public.clinics enable row level security;

create policy "clinics public read" on public.clinics
  for select using (true);
create policy "clinics admin write" on public.clinics
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- journal_categories
-- Lookup table so post categories are managed in the DB, not hardcoded strings.
-- ---------------------------------------------------------------------------
create table public.journal_categories (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,   -- 'eye-care', 'lens-technology', 'style'
  name        text        not null,          -- 'Eye care', 'Lens technology', 'Style'
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger journal_categories_set_updated_at
  before update on public.journal_categories
  for each row execute function public.set_updated_at();

alter table public.journal_categories enable row level security;

create policy "journal_categories public read" on public.journal_categories
  for select using (true);
create policy "journal_categories admin write" on public.journal_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- journal_posts  (US-P2-03)
-- Drafts are admin-only; only published posts are visible to the public.
-- body stores markdown. cover_image_url points to the 'journal' storage bucket.
-- ---------------------------------------------------------------------------
create table public.journal_posts (
  id               uuid        primary key default gen_random_uuid(),
  slug             text        not null unique,
  title            text        not null,
  excerpt          text,
  body             text,                              -- markdown
  category_id      uuid        references public.journal_categories (id) on delete set null,
  cover_image_url  text,
  read_minutes     integer     check (read_minutes > 0),
  author           text,
  is_featured      boolean     not null default false,
  status           text        not null default 'draft'
                                 check (status in ('draft', 'published')),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index journal_posts_status_idx       on public.journal_posts (status);
create index journal_posts_published_at_idx on public.journal_posts (published_at desc);
create index journal_posts_category_id_idx  on public.journal_posts (category_id);

create trigger journal_posts_set_updated_at
  before update on public.journal_posts
  for each row execute function public.set_updated_at();

alter table public.journal_posts enable row level security;

-- Public reads published only — drafts must not leak to the shop.
create policy "journal_posts public read published" on public.journal_posts
  for select using (status = 'published');
-- Admins see and write everything (drafts included).
create policy "journal_posts admin all" on public.journal_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- journal storage bucket — cover images (public read, admin write).
-- Mirrors the frames bucket from 20260607000001_storage.sql.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'journal', 'journal', true,
  5242880, -- 5 MB guard (delivery budget is <100 KB/image after optimisation)
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "journal public read"  on storage.objects;
create policy "journal public read" on storage.objects
  for select using (bucket_id = 'journal');

drop policy if exists "journal admin write" on storage.objects;
create policy "journal admin write" on storage.objects
  for all
  using  (bucket_id = 'journal' and public.is_admin())
  with check (bucket_id = 'journal' and public.is_admin());
