/*
  # Add service-specific analytics functions

  1. Changes
    - Add new functions for filtering issues by service type
    - Update existing analytics functions to use service type filtering
    
  2. Security
    - All functions are SECURITY DEFINER
    - Access granted to authenticated users
*/

-- Function to get service-specific reasons
create or replace function get_service_reasons(service_type text)
returns table (reason text)
language sql
security definer
as $$
  select reason 
  from (
    select reason from mechanical_reasons where service_type = 'mechanical'
    union all
    select reason from electrical_reasons where service_type = 'electrical'
  ) r;
$$;

-- Function to count issues by reason with service type filtering
create or replace function count_issues_by_reason(service_type text default null)
returns table (
  reason text,
  count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with valid_reasons as (
    select reason 
    from mechanical_reasons 
    where service_type = 'mechanical'
    union all
    select reason 
    from electrical_reasons 
    where service_type = 'electrical'
  )
  select jr.reason, count(*) as count
  from jamming_records jr
  inner join valid_reasons vr on jr.reason = vr.reason
  where (service_type is null or jr.service_type = service_type)
  group by jr.reason
  order by count desc
  limit 5;
end;
$$;

-- Function to count issues by roller with service type filtering
create or replace function count_issues_by_roller(service_type text default null)
returns table (
  roller_number integer,
  count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with valid_reasons as (
    select reason 
    from mechanical_reasons 
    where service_type = 'mechanical'
    union all
    select reason 
    from electrical_reasons 
    where service_type = 'electrical'
  )
  select jr.roller_number, count(*) as count
  from jamming_records jr
  inner join valid_reasons vr on jr.reason = vr.reason
  where (service_type is null or jr.service_type = service_type)
  group by jr.roller_number
  order by count desc
  limit 5;
end;
$$;

-- Function to predict failures with service type filtering
create or replace function predict_failures(service_type text default null)
returns table (
  roller_number int,
  probability float,
  predicted_days int,
  confidence int,
  likely_reasons json
)
language plpgsql
security definer
as $$
begin
  return query
  with valid_reasons as (
    select reason 
    from mechanical_reasons 
    where service_type = 'mechanical'
    union all
    select reason 
    from electrical_reasons 
    where service_type = 'electrical'
  ),
  roller_stats as (
    select 
      r.roller_number,
      count(*) as failure_count,
      extract(epoch from (now() - max(r.date))) / 86400 as days_since_last,
      array_agg(r.reason order by r.date desc) as recent_reasons
    from jamming_records r
    inner join valid_reasons vr on r.reason = vr.reason
    where (service_type is null or r.service_type = service_type)
    group by r.roller_number
    having count(*) >= 2
  ),
  max_failures as (
    select max(failure_count) as count
    from (
      select count(*) as failure_count
      from jamming_records jr
      inner join valid_reasons vr on jr.reason = vr.reason
      where (service_type is null or jr.service_type = service_type)
      group by jr.roller_number
    ) subq
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
        inner join valid_reasons vr on r.reason = vr.reason
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
end;
$$;

-- Grant access to functions
grant execute on function get_service_reasons(text) to authenticated;
grant execute on function count_issues_by_reason(text) to authenticated;
grant execute on function count_issues_by_roller(text) to authenticated;
grant execute on function predict_failures(text) to authenticated;