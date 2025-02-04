-- Исправляем функцию count_issues_by_reason
create or replace function count_issues_by_reason()
returns table (
  reason text,
  count bigint
)
language sql
security definer
as $$
  select jr.reason, count(*) as count
  from jamming_records jr
  group by jr.reason
  order by count desc
  limit 5;
$$;

-- Исправляем функцию count_issues_by_roller
create or replace function count_issues_by_roller()
returns table (
  roller_number integer,
  count bigint
)
language sql
security definer
as $$
  select jr.roller_number, count(*) as count
  from jamming_records jr
  group by jr.roller_number
  order by count desc
  limit 5;
$$;

-- Исправляем функцию get_reasons_by_service
create or replace function get_reasons_by_service(service service_role)
returns table (reason text)
language plpgsql
security definer
as $$
begin
  if service = 'mechanical' then
    return query 
    select mr.reason 
    from mechanical_reasons mr 
    order by mr.id;
  else
    return query 
    select er.reason 
    from electrical_reasons er 
    order by er.id;
  end if;
end;
$$;

-- Обновляем права доступа
grant execute on function count_issues_by_reason() to authenticated;
grant execute on function count_issues_by_roller() to authenticated;
grant execute on function get_reasons_by_service(service_role) to authenticated;