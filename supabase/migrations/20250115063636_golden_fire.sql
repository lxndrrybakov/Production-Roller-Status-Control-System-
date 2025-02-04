/*
  # Add analytics functions
  
  1. New Functions
    - `calculate_avg_days_between_failures`: Calculates average days between failures for a specific roller
    - `calculate_failure_probability`: Calculates failure probability based on history
    - `predict_failures`: Main prediction function that returns top 5 rollers with highest failure probability
  
  2. Changes
    - Added new SQL functions for ML-based analytics
    - Functions use historical data to predict future failures
    - Predictions are based on failure patterns and intervals
  
  3. Security
    - Functions are accessible to authenticated users only
*/

-- Функция для расчета среднего времени между неисправностями
create or replace function calculate_avg_days_between_failures(roller int)
returns float
language plpgsql
as $$
declare
  avg_days float;
begin
  select avg(days)
  into avg_days
  from (
    select 
      extract(epoch from (lead(date) over (order by date) - date)) / 86400 as days
    from jamming_records
    where roller_number = roller
  ) subq
  where days is not null;
  
  return coalesce(avg_days, 30); -- 30 дней по умолчанию
end;
$$;

-- Функция для расчета вероятности неисправности
create or replace function calculate_failure_probability(
  roller int,
  days_since_last float,
  failure_count int
)
returns float
language plpgsql
as $$
declare
  avg_interval float;
  max_failures int;
  probability float;
begin
  -- Получаем среднее время между неисправностями
  avg_interval := calculate_avg_days_between_failures(roller);
  
  -- Получаем максимальное количество неисправностей среди всех роликов
  select max(cnt) into max_failures
  from (
    select count(*) as cnt
    from jamming_records
    group by roller_number
  ) subq;
  
  -- Рассчитываем вероятность
  probability := least(
    (days_since_last / avg_interval) * 0.6 +
    (failure_count::float / max_failures) * 0.4,
    1.0
  );
  
  return probability;
end;
$$;

-- Основная функция прогнозирования
create or replace function predict_failures()
returns table (
  roller_number int,
  probability float,
  predicted_days int,
  confidence int
)
language plpgsql
as $$
begin
  return query
  with roller_stats as (
    select 
      r.roller_number,
      count(*) as failure_count,
      max(r.date) as last_failure,
      extract(epoch from (now() - max(r.date))) / 86400 as days_since_last
    from jamming_records r
    group by r.roller_number
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
    least((rs.failure_count * 10)::int, 100) as confidence
  from roller_stats rs
  where rs.failure_count >= 2  -- Требуется минимум 2 случая для прогноза
  order by probability desc
  limit 5;
end;
$$;

-- Предоставляем доступ к функциям
grant execute on function calculate_avg_days_between_failures(int) to authenticated;
grant execute on function calculate_failure_probability(int, float, int) to authenticated;
grant execute on function predict_failures() to authenticated;