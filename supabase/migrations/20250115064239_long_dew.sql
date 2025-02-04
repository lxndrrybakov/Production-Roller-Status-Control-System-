/*
  # Enhanced failure prediction system
  
  1. New Functions
    - `get_failure_patterns`: Analyzes patterns in failures for a specific roller
    - `predict_failure_type`: Predicts most likely failure types for a roller
  
  2. Changes
    - Drop and recreate predict_failures function with new return type
    - Added failure type prediction
    - Improved confidence calculation
  
  3. Security
    - Functions are accessible to authenticated users only
*/

-- Сначала удаляем существующую функцию
drop function if exists predict_failures();

-- Функция для анализа паттернов неисправностей
create or replace function get_failure_patterns(roller_num int)
returns table (
  reason text,
  frequency float,
  avg_interval float
)
language plpgsql
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

-- Функция для предсказания типа неисправности
create or replace function predict_failure_type(roller_num int)
returns table (
  reason text,
  probability float,
  confidence int
)
language plpgsql
as $$
declare
  total_failures int;
  last_failure_date timestamptz;
  last_failure_type text;
begin
  -- Получаем общее количество неисправностей и последнюю неисправность
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
      -- Рассчитываем базовую вероятность на основе частоты
      frequency * 0.4 +
      -- Корректируем на основе времени с последней неисправности
      case 
        when last_failure_type = reason then 0.3
        else 0.1
      end +
      -- Корректируем на основе среднего интервала
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

-- Создаем новую функцию прогнозирования с обновленным типом возвращаемых данных
create or replace function predict_failures()
returns table (
  roller_number int,
  probability float,
  predicted_days int,
  confidence int,
  likely_reasons json
)
language plpgsql
as $$
begin
  return query
  with roller_stats as (
    select 
      r.roller_number,
      count(*) as failure_count,
      extract(epoch from (now() - max(r.date))) / 86400 as days_since_last
    from jamming_records r
    group by r.roller_number
    having count(*) >= 2
  )
  select 
    rs.roller_number,
    calculate_failure_probability(
      rs.roller_number, 
      rs.days_since_last,
      rs.failure_count::int
    ) as probability,
    (calculate_avg_days_between_failures(rs.roller_number) * 
     (1 - calculate_failure_probability(
       rs.roller_number, 
       rs.days_since_last,
       rs.failure_count::int
     )))::int as predicted_days,
    least((rs.failure_count * 10)::int, 100) as confidence,
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

-- Предоставляем доступ к функциям
grant execute on function get_failure_patterns(int) to authenticated;
grant execute on function predict_failure_type(int) to authenticated;
grant execute on function predict_failures() to authenticated;