-- Lumen Eye Care — order tracking fields (recovered).
--
-- RECOVERY NOTE: this migration was applied to staging on 2026-06-15 (version
-- 20260615000002, name "order_tracking") but its .sql file was never committed —
-- the older CLI did not store statement bodies, so it could not be read back from
-- supabase_migrations.schema_migrations. The contents below were reconstructed by
-- diffing the live staging schema against the committed migrations: the delta on
-- `orders` was exactly two columns (`courier`, `tracking_number`) and one index
-- (`orders_user_id_idx`). Types reconstructed as nullable `text` (free-text
-- courier name + tracking number). Idempotent guards added so a fresh-DB build
-- (e.g. prod first deploy) applies cleanly even though staging already has these.
--
-- These columns are currently unused by the app (the order tracker derives stages
-- from `orders.status`); they exist for a future courier/tracking integration.

alter table public.orders
  add column if not exists courier         text,
  add column if not exists tracking_number text;

create index if not exists orders_user_id_idx on public.orders (user_id);
