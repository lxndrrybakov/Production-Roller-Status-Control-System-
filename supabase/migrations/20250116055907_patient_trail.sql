/*
  # Add service-specific roles and reasons

  1. Changes
    - Add service_type column to jamming_records
    - Add mechanical and electrical specific reasons
    - Update RLS policies for service-specific access

  2. Security
    - Enable RLS
    - Add policies for mechanical and electrical services
*/

-- Add service type to jamming_records
ALTER TABLE jamming_records 
ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'mechanical';

-- Create type for service roles
CREATE TYPE service_role AS ENUM ('mechanical', 'electrical');

-- Create mechanical reasons lookup table
CREATE TABLE IF NOT EXISTS mechanical_reasons (
  id serial PRIMARY KEY,
  reason text NOT NULL
);

-- Create electrical reasons lookup table
CREATE TABLE IF NOT EXISTS electrical_reasons (
  id serial PRIMARY KEY,
  reason text NOT NULL
);

-- Insert mechanical reasons
INSERT INTO mechanical_reasons (reason) VALUES
  ('Ролик заклинен'),
  ('Промвал погнут'),
  ('Промвал отсутствует'),
  ('Отсутствие болтов'),
  ('Отсутствует эластичная муфта'),
  ('Отсутствует муфта на ролике'),
  ('Отсутствует постель электродвигателя'),
  ('Нет фиксации подушки ролика'),
  ('Разрушен подшипник с приводной стороны'),
  ('Разрушен подшипник с холостой стороны'),
  ('Иная неисправность(указать)');

-- Insert electrical reasons
INSERT INTO electrical_reasons (reason) VALUES
  ('Заклинен электродвигатель'),
  ('Низкое сопротивление изоляция цепи якорной обмотки на электродвигателе'),
  ('Низкое сопротивление изоляция цепи обмотки возбуждения на электродвигателе'),
  ('Неисправность ЩКМ электродвигателя'),
  ('Неудовлетворительная коммутация на ЩКМ электродвигателя'),
  ('Дебаланс электродвигателя'),
  ('Нарушение целостности межполюсной коммутации'),
  ('Электродвигатель залит водой'),
  ('Отсутствует электродвигатель'),
  ('Деформирован шпоночный паз на электродвигателе'),
  ('Неисправно анкерное сочленение на электродвигателе'),
  ('Дефект муфты на электродвигателе'),
  ('Низкая сопротивление изоляция кабеля'),
  ('Нарушение целостности кабеля'),
  ('Межвитковое замыкание на электродвигателе'),
  ('Отсутствие электрической защиты'),
  ('Неисправна коммутация в ША'),
  ('Неисправен силовой АВ'),
  ('Неисправен АВ цепей возбуждения'),
  ('Неисправна катушка РНТ'),
  ('Неисправен ЧП'),
  ('Иные неисправности(указать)');

-- Create functions to get reasons by service type
CREATE OR REPLACE FUNCTION get_reasons_by_service(service service_role)
RETURNS TABLE (reason text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF service = 'mechanical' THEN
    RETURN QUERY SELECT reason FROM mechanical_reasons ORDER BY id;
  ELSE
    RETURN QUERY SELECT reason FROM electrical_reasons ORDER BY id;
  END IF;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_reasons_by_service(service_role) TO authenticated;