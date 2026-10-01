-- Supabase の SQL Editor でこのファイルの内容をそのまま実行してください。
-- すべての行は owner_id（ログイン中のアカウント）に紐づき、RLS により本人しか読み書きできません。

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric not null check (amount > 0),
  date date not null,
  category text not null,
  memo text not null default '',
  created_at timestamptz not null default now()
);
create index expenses_profile_id_idx on public.expenses (profile_id);

create table public.fixed_costs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  amount numeric not null check (amount > 0),
  occurrence_day text not null default '',
  created_at timestamptz not null default now()
);
create index fixed_costs_profile_id_idx on public.fixed_costs (profile_id);

-- 固定費を削除しても生成済みの月次記録は残す（fixed_cost_id を null にする）。
create table public.fixed_cost_monthly_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  fixed_cost_id uuid references public.fixed_costs (id) on delete set null,
  name text not null,
  amount numeric not null,
  year_month text not null,
  created_at timestamptz not null default now(),
  unique (fixed_cost_id, year_month)
);
create index fixed_cost_monthly_records_profile_id_idx on public.fixed_cost_monthly_records (profile_id);

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.fixed_costs enable row level security;
alter table public.fixed_cost_monthly_records enable row level security;

create policy "own rows" on public.profiles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own rows" on public.expenses
  for all using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = profile_id and p.owner_id = auth.uid())
  );

create policy "own rows" on public.fixed_costs
  for all using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = profile_id and p.owner_id = auth.uid())
  );

create policy "own rows" on public.fixed_cost_monthly_records
  for all using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = profile_id and p.owner_id = auth.uid())
  );
