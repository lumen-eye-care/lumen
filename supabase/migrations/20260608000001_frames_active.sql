-- Lumen Eye Care — frames soft-archive (US-P1-07 admin).
-- Admin "delete frame" is a soft-archive: setting is_active = false hides the
-- frame from the storefront while preserving order_items.frame_id history (a
-- hard delete would NULL those references via the FK and lose what was bought).
--
-- Keeps RLS on (CLAUDE.md security rule 6). The public-read policy is tightened
-- so archived frames are hidden at the DB layer for non-admins (defense in
-- depth); admins still see everything. Admin-write policy is unchanged.
-- Idempotent / re-runnable, matching the 20260607000001_storage.sql style.

alter table public.frames
  add column if not exists is_active boolean not null default true;

-- Hide archived frames from anon/customer reads; admins (is_admin) see all.
drop policy if exists "frames public read" on public.frames;
create policy "frames public read" on public.frames
  for select using (is_active = true or public.is_admin());
