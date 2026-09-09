create table if not exists public.whatsapp_customers (
  phone_number text primary key,
  display_name text,
  balance numeric(18, 2) not null default 0,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.whatsapp_orders (
  id text primary key,
  customer_phone text not null references public.whatsapp_customers(phone_number),
  product_name text not null,
  amount numeric(18, 2) not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_deposits (
  id text primary key,
  customer_phone text not null references public.whatsapp_customers(phone_number),
  amount numeric(18, 2) not null default 0,
  status text not null default 'pending',
  reference text,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_customers enable row level security;
alter table public.whatsapp_orders enable row level security;
alter table public.whatsapp_deposits enable row level security;
