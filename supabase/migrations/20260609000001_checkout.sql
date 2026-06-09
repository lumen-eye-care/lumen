-- Lumen Eye Care — checkout funnel (US-P0-05/06/07).
-- Adds the delivery snapshot + initiate-idempotency columns the checkout needs,
-- and an append-only status guard so a replayed/late Paystack webhook can never
-- downgrade a fulfilled order (CLAUDE.md: webhook idempotency + correctness).
--
-- v1 requires sign-in for checkout, so the existing "orders insert own" RLS
-- (auth.uid() = user_id) is correct as-is — no policy change. E-Levy was repealed
-- in Ghana (2 Apr 2025); e_levy_amount stays 0 and is not surfaced.
-- Idempotent / re-runnable, matching the 20260607000001_storage.sql style.

-- ---------------------------------------------------------------------------
-- Delivery snapshot on the order (address book is a later story, US-P1-06).
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists delivery_name     text,
  add column if not exists delivery_phone    text, -- E.164 (+233...)
  add column if not exists delivery_city     text,
  add column if not exists delivery_address  text,
  add column if not exists delivery_landmark text;

-- ---------------------------------------------------------------------------
-- Initiate idempotency: a repeated Idempotency-Key returns the existing order
-- instead of creating a second order + Paystack charge.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists idempotency_key text;

create unique index if not exists orders_idempotency_key_key
  on public.orders (idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- Append-only status guard: once an order is 'paid' it cannot revert to a
-- pre-fulfilment state. Defends against replayed/out-of-order webhooks
-- downgrading a confirmed payment. Forward moves (shipped/delivered/refunded)
-- are still allowed for admin fulfilment.
-- ---------------------------------------------------------------------------
create or replace function public.guard_order_status_transition()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'paid'
     and new.status in ('pending', 'failed', 'failed_timeout') then
    raise exception 'Illegal order status transition: % -> %', old.status, new.status;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_guard_status on public.orders;
create trigger orders_guard_status
  before update of status on public.orders
  for each row execute function public.guard_order_status_transition();
