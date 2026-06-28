create table if not exists public.app_state (
  id text primary key,
  data jsonb not null default '{"garments":[],"categories":["All"]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Allow public read app state" on public.app_state;
drop policy if exists "Allow public insert app state" on public.app_state;
drop policy if exists "Allow public update app state" on public.app_state;
drop policy if exists "Allow own app state read" on public.app_state;
drop policy if exists "Allow own app state insert" on public.app_state;
drop policy if exists "Allow own app state update" on public.app_state;
drop policy if exists "Allow own app state delete" on public.app_state;

create policy "Allow own app state read"
  on public.app_state
  for select
  to authenticated
  using (id = auth.uid()::text);

create policy "Allow own app state insert"
  on public.app_state
  for insert
  to authenticated
  with check (id = auth.uid()::text);

create policy "Allow own app state update"
  on public.app_state
  for update
  to authenticated
  using (id = auth.uid()::text)
  with check (id = auth.uid()::text);

create policy "Allow own app state delete"
  on public.app_state
  for delete
  to authenticated
  using (id = auth.uid()::text);

alter table public.app_state replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.app_state;
exception
  when duplicate_object then null;
end $$;
