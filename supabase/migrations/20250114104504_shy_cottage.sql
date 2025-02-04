/*
  # Add analytics functions
  
  1. New Functions
    - count_issues_by_reason: Counts issues grouped by reason
    - count_issues_by_roller: Counts issues grouped by roller number
  
  2. Security
    - Functions are accessible to all authenticated users
*/

-- Function to count issues by reason
create or replace function count_issues_by_reason()
returns table (
  reason text,
  count bigint
)
language sql
security definer
as $$
  select reason, count(*) as count
  from jamming_records
  group by reason
  order by count desc
  limit 5;
$$;

-- Function to count issues by roller
create or replace function count_issues_by_roller()
returns table (
  roller_number integer,
  count bigint
)
language sql
security definer
as $$
  select roller_number, count(*) as count
  from jamming_records
  group by roller_number
  order by count desc
  limit 5;
$$;

-- Grant access to the functions
grant execute on function count_issues_by_reason to authenticated;
grant execute on function count_issues_by_roller to authenticated;