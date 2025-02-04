-- Function to get service-specific reasons
create or replace function get_service_reasons(service_type text)
returns table (reason text)
language plpgsql
security definer
as $$
begin
  if service_type = 'mechanical' then
    return query select reason from mechanical_reasons;
  else
    return query select reason from electrical_reasons;
  end if;
end;
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
  if service_type = 'mechanical' then
    return query
    select jr.reason, count(*) as count
    from jamming_records jr
    inner join mechanical_reasons mr on jr.reason = mr.reason
    group by jr.reason
    order by count desc
    limit 5;
  elsif service_type = 'electrical' then
    return query
    select jr.reason, count(*) as count
    from jamming_records jr
    inner join electrical_reasons er on jr.reason = er.reason
    group by jr.reason
    order by count desc
    limit 5;
  else
    return query
    select jr.reason, count(*) as count
    from jamming_records jr
    group by jr.reason
    order by count desc
    limit 5;
  end if;
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
  if service_type = 'mechanical' then
    return query
    select jr.roller_number, count(*) as count
    from jamming_records jr
    inner join mechanical_reasons mr on jr.reason = mr.reason
    group by jr.roller_number
    order by count desc
    limit 5;
  elsif service_type = 'electrical' then
    return query
    select jr.roller_number, count(*) as count
    from jamming_records jr
    inner join electrical_reasons er on jr.reason = er.reason
    group by jr.roller_number
    order by count desc
    limit 5;
  else
    return query
    select jr.roller_number, count(*) as count
    from jamming_records jr
    group by jr.roller_number
    order by count desc
    limit 5;
  end if;
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
declare
  max_failures bigint;
  reason_table text;
begin
  -- Determine which reasons table to use
  if service_type = 'mechanical' then
    reason_table := 'mechanical_reasons';
  elsif service_type = 'electrical' then
    reason_table := 'electrical_reasons';
  end if;

  -- Calculate max failures for the given service type
  if service_type is not null then
    execute format('
      select max(failure_count) from (
        select count(*) as failure_count
        from jamming_records jr
        inner join %I r on jr.reason = r.reason
        group by jr.roller_number
      ) subq', reason_table) into max_failures;
  else
    select max(failure_count) into max_failures
    from (
      select count(*) as failure_count
      from jamming_records
      group by roller_number
    ) subq;
  end if;

  -- Main query
  return query
  with roller_stats as (
    select 
      r.roller_number,
      count(*) as failure_count,
      extract(epoch from (now() - max(r.date))) / 86400 as days_since_last,
      array_agg(r.reason order by r.date desc) as recent_reasons
    from jamming_records r
    where case 
      when service_type = 'mechanical' then
        exists (select 1 from mechanical_reasons mr where r.reason = mr.reason)
      when service_type = 'electrical' then
        exists (select 1 from electrical_reasons er where r.reason = er.reason)
      else true
    end
    group by r.roller_number
    having count(*) >= 2
  )
  select 
    rs.roller_number,
    (
      0.4 * (rs.days_since_last / 30) +
      0.3 * (rs.failure_count::float / max_failures) +
      0.3 * case when rs.recent_reasons[1] = rs.recent_reasons[2] then 1 else 0.5 end
    )::float as probability,
    (30 * (1 - least(
      (rs.days_since_last / 30) * 0.6 +
      (rs.failure_count::float / max_failures) * 0.4,
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
          and case 
            when service_type = 'mechanical' then
              exists (select 1 from mechanical_reasons mr where r.reason = mr.reason)
            when service_type = 'electrical' then
              exists (select 1 from electrical_reasons er where r.reason = er.reason)
            else true
          end
        group by r.reason
        order by count(*) desc
        limit 3
      ) ft
    ) as likely_reasons
  from roller_stats rs
  where (
    0.4 * (rs.days_since_last / 30) +
    0.3 * (rs.failure_count::float / max_failures) +
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