-- Обновляем таблицу maintenance_records
alter table if exists public.maintenance_records
add column if not exists resolved boolean default false;

-- Обновляем таблицу jamming_records
alter table if exists public.jamming_records
add column if not exists resolved boolean default false;

-- Создаем индексы для поля resolved
create index if not exists maintenance_records_resolved_idx 
on public.maintenance_records(resolved);

create index if not exists jamming_records_resolved_idx 
on public.jamming_records(resolved);

-- Обновляем политики
drop policy if exists "Enable update for authenticated users" on public.maintenance_records;
drop policy if exists "Enable update for authenticated users" on public.jamming_records;

create policy "Enable update for authenticated users" on public.maintenance_records
  for update using (true);

create policy "Enable update for authenticated users" on public.jamming_records
  for update using (true);