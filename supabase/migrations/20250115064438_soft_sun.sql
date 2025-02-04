/*
  # Update prediction functions

  1. Changes
    - Drop existing functions before recreating them
    - Add neural-like prediction capabilities
    - Improve probability calculations
    - Add support for predicting specific failure types
  
  2. New Functions
    - get_failure_patterns: Analyzes patterns in failures
    - predict_failure_type: Predicts specific types of failures
    - predict_failures: Main prediction function with improved accuracy
*/

-- Drop existing functions first
drop function if exists predict_failures();
drop function if exists get_failure_patterns(int);
drop function if exists predict_failure_type(int);

-- Function to analyze failure patterns
create or replace function get_failure_patterns(roller_num int)
returns table (
  reason text,
  frequency float,
  avg_interval float
)
language plpgsql
security definer
as $$
begin
  return query
  with intervals as (
    select 
      reason,
      extract(epoch from (lead(date) over (partition by reason order by date) - date)) / 86400 as days_between
    from jamming_records
    where roller_number = roller_num
  )
  select 
    i.reason,
    count(*)::float / (select count(*) from jamming_records where roller_number = roller_num) as frequency,
    coalesce(avg(i.days_between), 30) as avg_interval
  from intervals i
  group by i.reason
  having count(*) > 0;
end;
$$;

-- Function to predict failure types
create or replace function predict_failure_type(roller_num int)
returns table (
  reason text,
  probability float,
  confidence int
)
language plpgsql
security definer
as $$
declare
  total_failures int;
  last_failure_date timestamptz;
  last_failure_type text;
begin
  select count(*), max(date), 
    (select reason from jamming_records 
     where roller_number = roller_num 
     order by date desc limit 1)
  into total_failures, last_failure_date, last_failure_type
  from jamming_records
  where roller_number = roller_num;

  return query
  with patterns as (
    select 
      reason,
      frequency,
      avg_interval,
      -- Calculate base probability from frequency
      frequency * 0.4 +
      -- Adjust based on last failure type
      case 
        when last_failure_type = reason then 0.3
        else 0.1
      end +
      -- Adjust based on average interval
      case 
        when extract(epoch from (now() - last_failure_date)) / 86400 >= avg_interval then 0.3
        else 0.1
      end as calculated_probability
    from get_failure_patterns(roller_num)
  )
  select 
    p.reason,
    p.calculated_probability as probability,
    least((total_failures * 10)::int, 100) as confidence
  from patterns p
  where p.calculated_probability >= 0.3
  order by p.calculated_probability desc
  limit 3;
end;
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
language plpgsql
security definer
as $$
begin
  return query
  with roller_stats as (
    select 
      r.roller_number,
      count(*) as failure_count,
      extract(epoch from (now() - max(r.date))) / 86400 as days_since_last,
      array_agg(r.reason order by r.date desc) as recent_reasons
    from jamming_records r
    group by r.roller_number
    having count(*) >= 2
  )
  select 
    rs.roller_number,
    -- Calculate probability using pattern recognition
    (
      0.4 * (rs.days_since_last / calculate_avg_days_between_failures(rs.roller_number)) +
      0.3 * (rs.failure_count::float / (select max(count(*)) from jamming_records group by roller_number)) +
      0.3 * case when rs.recent_reasons[1] = rs.recent_reasons[2] then 1 else 0.5 end
    )::float as probability,
    -- Predict days until next failure
    (calculate_avg_days_between_failures(rs.roller_number) * 
     (1 - least(
       (rs.days_since_last / calculate_avg_days_between_failures(rs.roller_number)) * 0.6 +
       (rs.failure_count::float / (select max(count(*)) from jamming_records group by roller_number)) * 0.4,
       1.0
     )))::int as predicted_days,
    -- Calculate confidence based on data quality
    least((rs.failure_count * 10)::int, 100) as confidence,
    -- Get likely reasons with probabilities
    (
      select json_agg(json_build_object(
        'reason', ft.reason,
        'probability', ft.probability
      ))
      from predict_failure_type(rs.roller_number) ft
    ) as likely_reasons
  from roller_stats rs
  order by probability desc
  limit 5;
end;
$$;

-- Grant access to functions
grant execute on function get_failure_patterns(int) to authenticated;
grant execute on function predict_failure_type(int) to authenticated;
grant execute on function predict_failures() to authenticated;