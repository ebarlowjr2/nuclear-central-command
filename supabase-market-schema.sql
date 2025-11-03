
create extension if not exists pgcrypto;

create table if not exists securities (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  category text not null,     -- 'ETF' | 'SMR/Advanced' | 'Fuel & Equipment' | 'Utility'
  exchange text,
  country text default 'US',
  notes text,
  is_active boolean default true,
  added_at timestamptz default now()
);

create table if not exists security_quotes (
  symbol text primary key references securities(symbol) on delete cascade,
  price numeric,
  change_pct numeric,
  currency text default 'USD',
  updated_at timestamptz default now()
);

create table if not exists security_prices_daily (
  symbol text references securities(symbol) on delete cascade,
  px_date date not null,
  open numeric,
  high numeric,
  low numeric,
  close numeric,
  volume bigint,
  primary key (symbol, px_date)
);

create index if not exists idx_securities_category on securities(category);
create index if not exists idx_securities_is_active on securities(is_active);
create index if not exists idx_security_prices_daily_date on security_prices_daily(px_date);

select 'Securities table created' as status;
select 'Security quotes table created' as status;
select 'Security prices daily table created' as status;
