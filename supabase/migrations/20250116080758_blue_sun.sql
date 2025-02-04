-- Обновляем функцию count_issues_by_reason для учета типа службы
create or replace function count_issues_by_reason(service_type text default null)
returns table (
  reason text,
  count bigint
)
language sql
security definer
as $$
  select jr.reason, count(*) as count
  from jamming_records jr
  where (service_type is null or jr.service_type = service_type)
  group by jr.reason
  order by count desc
  limit 5;
$$;

-- Обновляем функцию count_issues_by_roller для учета типа службы
create or replace function count_issues_by_roller(service_type text default null)
returns table (
  roller_number integer,
  count bigint
)
language sql
security definer
as $$
  select jr.roller_number, count(*) as count
  from jamming_records jr
  where (service_type is null or jr.service_type = service_type)
  group by jr.roller_number
  order by count desc
  limit 5;
$$;

-- Создаем вспомогательную функцию для подсчета максимального количества неисправностей
create or replace function get_max_failures(service_type text default null)
returns bigint
language sql
security definer
as $$
  select max(failure_count)
  from (
    select count(*) as failure_count
    from jamming_records
    where (service_type is null or service_type = service_type)
    group by roller_number
  ) subq;
$$;

-- Обновляем функцию predict_failures для учета типа службы
create or replace function predict_failures(service_type text default null)
returns table (
  roller_number int,
  probability float,
  predicted_days int,
  confidence int,
  likely_reasons json
)
language sql
security definer
as $$
  with roller_stats as (
    select 
      r.roller_number,
      count(*) as failure_count,
      extract(epoch from (now() - max(r.date))) / 86400 as days_since_last,
      array_agg(r.reason order by r.date desc) as recent_reasons
    from jamming_records r
    where (service_type is null or r.service_type = service_type)
    group by r.roller_number
    having count(*) >= 2
  ),
  max_failures as (
    select get_max_failures(service_type) as count
  )
  select 
    rs.roller_number,
    (
      0.4 * (rs.days_since_last / 30) +
      0.3 * (rs.failure_count::float / (select count from max_failures)) +
      0.3 * case when rs.recent_reasons[1] = rs.recent_reasons[2] then 1 else 0.5 end
    )::float as probability,
    (30 * (1 - least(
      (rs.days_since_last / 30) * 0.6 +
      (rs.failure_count::float / (select count from max_failures)) * 0.4,
      1.0
    )))::int as predicted_days,
    least((rs.failure_count * 10)::int, 100) as confidence,
    (
      select json_agg(json_build_object(
        'reason', ft.reason,
        'probability', ft.probability
      ))
      from (
        select 
          r.reason,
          count(*)::float / rs.failure_count as probability
        from jamming_records r
        where r.roller_number = rs.roller_number
          and (service_type is null or r.service_type = service_type)
        group by r.reason
        order by count(*) desc
        limit 3
      ) ft
    ) as likely_reasons
  from roller_stats rs
  where (
    0.4 * (rs.days_since_last / 30) +
    0.3 * (rs.failure_count::float / (select count from max_failures)) +
    0.3 * case when rs.recent_reasons[1] = rs.recent_reasons[2] then 1 else 0.5 end
  )::float >= 0.3
  order by probability desc
  limit 5;
$$;

-- Обновляем права доступа
grant execute on function count_issues_by_reason(text) to authenticated;
grant execute on function count_issues_by_roller(text) to authenticated;
grant execute on function get_max_failures(text) to authenticated;
grant execute on function predict_failures(text) to authenticated;