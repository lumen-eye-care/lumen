-- Lumen Eye Care — order shipment tracking (US-P1-05).
-- Adds admin-entered shipment info to an order so the customer-facing tracker
-- can show who's delivering + a tracking reference. No carrier-API integration:
-- Ghana dispatch is Yango/Bolt/manual, so the tracking number is informational
-- and set by an admin at ship time.
--
-- RLS unchanged — "orders select own" (owner) + "orders admin all" already cover
-- reads/writes; the new columns inherit row-level access. The append-only status
-- guard (20260609000001_checkout.sql) already allows the forward shipped ->
-- delivered move, so no trigger change is needed.
-- Idempotent / re-runnable, matching the 20260609000001_checkout.sql style.

alter table public.orders
  add column if not exists courier         text,  -- e.g. Yango / Bolt / DHL / manual
  add column if not exists tracking_number text;  -- courier-supplied reference, if any
