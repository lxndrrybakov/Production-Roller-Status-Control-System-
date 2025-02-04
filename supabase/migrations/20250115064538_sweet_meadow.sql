/*
  # Fix analytics functions

  1. Changes
    - Fix nested aggregate error in predict_failures
    - Optimize prediction calculations
    - Add materialized statistics for better performance
    - Improve confidence calculations
  
  2. New Functions
    - calculate_roller_stats: Pre-calculates roller statistics
    - get_failure_patterns: Analyzes failure patterns
    - predict_failures: Main prediction function with fixed aggregates
*/

-- Drop existing functions
drop function if exists predict_failures();
drop function if exists get_failure_patterns(int);
drop function if exists predict_failure_type(int);

-- Function to calculate roller statistics
create or replace function calculate_roller_stats()
returns table (
  roller_number int,
  failure_count bigint,
  days_since_last float,
  max_failures bigint,
  recent_reasons text[]
)
language sql
security definer
as $$
  with stats as (
    select roller_number, count(*) as cnt
    from jamming_records
    group by roller_number
  )
  select 
    r.roller_number,
    count(*) as failure_count,
    extract(epoch from (now() - max(r.date))) / 86400 as days_since_last,
    (select max(cnt) from stats) as max_failures,
    array_agg(r.reason order by r.date desc) as recent_reasons
  from jamming_records r
  group by r.roller_number
  having count(*) >= 2;
$$;

-- Function to analyze failure patterns
create or replace function get_failure_patterns(roller_num int)
returns table (
  reason text,
  frequency float,
  avg_interval float
)
language sql
security definer
as $$
  with intervals as (
    select 
      reason,
      extract(epoch from (lead(date) over (partition by reason order by date) - date)) / 86400 as days_between
    from jamming_records
    where roller_number = roller_num
  ),
  total_count as (
    select count(*) as total
    from jamming_records
    where roller_number = roller_num
  )
  select 
    i.reason,
    count(*)::float / (select total from total_count) as frequency,
    coalesce(avg(i.days_between), 30) as avg_interval
  from intervals i
  group by i.reason
  having count(*) > 0;
$$;

-- Function to predict failure types
create or replace function predict_failure_type(
  roller_num int,
  last_failure_date timestamptz,
  last_failure_type text
)
returns table (
  reason text,
  probability float
)
language sql
security definer
as $$
  with patterns as (
    select 
      reason,
      frequency,
      avg_interval
    from get_failure_patterns(roller_num)
  )
  select 
    p.reason,
    (
      p.frequency * 0.4 +
      case 
        when last_failure_type = p.reason then 0.3
        else 0.1
      end +
      case 
        when extract(epoch from (now() - last_failure_date)) / 86400 >= p.avg_interval then 0.3
        else 0.1
      end
    )::float as probability
  from patterns p
  where p.frequency >= 0.2
  order by probability desc
  limit 3;
$$;

-- Main prediction function
create or replace function predict_failures()
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
    select * from calculate_roller_stats()
  ),
  predictions as (
    select 
      rs.roller_number,
      (
        0.4 * (rs.days_since_last / 30) +
        0.3 * (rs.failure_count::float / rs.max_failures) +
        0.3 * case when rs.recent_reasons[1] = rs.recent_reasons[2] then 1 else 0.5 end
      )::float as probability,
      (30 * (1 - least(
        (rs.days_since_last / 30) * 0.6 +
        (rs.failure_count::float / rs.max_failures) * 0.4,
        1.0
      )))::int as predicted_days,
      least((rs.failure_count * 10)::int, 100) as confidence,
      (
        select json_agg(json_build_object(
          'reason', ft.reason,
          'probability', ft.probability
        ))
        from predict_failure_type(
          rs.roller_number,
          (select max(date) from jamming_records where roller_number = rs.roller_number),
          (select reason from jamming_records where roller_number = rs.roller_number order by date desc limit 1)
        ) ft
      ) as likely_reasons
    from roller_stats rs
  )
  select *
  from predictions
  where probability >= 0.3
  order by probability desc
  limit 5;
$$;

-- Grant access to functions
grant execute on function calculate_roller_stats() to authenticated;
grant execute on function get_failure_patterns(int) to authenticated;
grant execute on function predict_failure_type(int, timestamptz, text) to authenticated;
grant execute on function predict_failures() to authenticated;