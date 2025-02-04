-- Обновляем таблицу jamming_records
alter table public.jamming_records 
add column if not exists resolved boolean default false;

-- Создаем индекс для поля resolved
create index if not exists jamming_records_resolved_idx 
on public.jamming_records(resolved);