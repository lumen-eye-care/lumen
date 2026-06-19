-- Lumen Eye Care — lens catalogue depth (US-P2-02 follow-up).
-- The base lens builder shipped a flat add-on list. To make ONE DB catalogue the
-- single source of truth for both the /lens-guide quiz and the PDP builder, and to
-- offer an optician-grade set, add-ons are now GROUPED (coatings · sun/tint · lens
-- thickness) and a group can be single-select (the lens index/material, where you
-- pick exactly one).
--
-- Additive + RLS-unchanged: existing rows default to group 'coating', not
-- single-select — the public-read / admin-write policies from 20260617000001 still
-- apply. The column is named "addon_group" (not "group") to avoid the reserved word
-- and the need to quote it in every PostgREST select.

alter table public.lens_addons
  add column addon_group   text    not null default 'coating',
  add column single_select boolean not null default false;

-- Only the three groups the builder renders. New groups => widen this CHECK + the
-- admin enum (src/lib/lens-schemas.ts) + the builder buckets together.
alter table public.lens_addons
  add constraint lens_addons_group_check
  check (addon_group in ('coating', 'sun', 'thickness'));
