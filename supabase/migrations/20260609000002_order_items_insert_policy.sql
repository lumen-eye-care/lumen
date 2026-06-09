-- ---------------------------------------------------------------------------
-- Fix: order_items had no customer INSERT policy.
--
-- 20260606000001_init.sql gave order_items only "read own" (SELECT) and
-- "admin all" policies. A signed-in customer checking out (createPendingOrder,
-- src/server/checkout.ts) inserts line items through the RLS-gated client and
-- was rejected: "new row violates row-level security policy for table
-- order_items". The orders row inserted fine ("orders insert own" exists), so
-- only the items failed — surfacing to the customer as "Could not start your
-- order. Please try again." This passed pre-launch testing because it was
-- exercised as the seed admin, whose "admin all" policy permits inserts.
--
-- Mirror "orders insert own": a customer may insert an item only for an order
-- they own. with check is re-evaluated per row, so this can't be used to attach
-- items to someone else's order.
-- ---------------------------------------------------------------------------

create policy "order_items insert own" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );
