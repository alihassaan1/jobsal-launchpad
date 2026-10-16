create table public.paypal_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  paypal_order_id text not null unique,
  product_key text not null,
  amount_cents integer not null,
  currency text not null default 'EUR',
  status text not null default 'created',
  environment text not null default 'sandbox',
  listing_credits integer not null default 0,
  featured_days integer not null default 0,
  captured_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.paypal_orders enable row level security;
grant select on public.paypal_orders to authenticated;
grant all on public.paypal_orders to service_role;
create policy "Users view own paypal orders" on public.paypal_orders
  for select to authenticated using (auth.uid() = user_id);