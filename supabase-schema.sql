create table if not exists public.app_state (
  id text primary key,
  data jsonb not null default '{"garments":[],"categories":["All"]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Allow public read app state" on public.app_state;
drop policy if exists "Allow public insert app state" on public.app_state;
drop policy if exists "Allow public update app state" on public.app_state;

create policy "Allow public read app state"
  on public.app_state
  for select
  to anon, authenticated
  using (true);

create policy "Allow public insert app state"
  on public.app_state
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow public update app state"
  on public.app_state
  for update
  to anon, authenticated
  using (true)
  with check (true);

alter table public.app_state replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.app_state;
exception
  when duplicate_object then null;
end $$;
