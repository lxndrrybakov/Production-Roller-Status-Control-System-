/*
  # Создание основных таблиц

  1. Новые таблицы
    - `maintenance_records` - записи обслуживания
      - `id` (uuid, primary key)
      - `roller_number` (integer)
      - `line_number` (integer) 
      - `reason` (text)
      - `date` (timestamptz)
      - `service_type` (text)
      - `resolved` (boolean)

    - `jamming_records` - записи заклиниваний
      - `id` (uuid, primary key)
      - `roller_number` (integer)
      - `line_number` (integer)
      - `reason` (text)
      - `date` (timestamptz)
      - `service_type` (text)
      - `resolved` (boolean)

    - `shift_notes` - заметки смены
      - `id` (uuid, primary key)
      - `content` (text)
      - `date` (timestamptz)
      - `author_role` (text)

  2. Безопасность
    - Включение RLS для всех таблиц
    - Добавление политик для аутентифицированных пользователей
*/

-- Создание таблицы maintenance_records
CREATE TABLE IF NOT EXISTS maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roller_number integer NOT NULL,
  line_number integer NOT NULL,
  reason text NOT NULL,
  date timestamptz DEFAULT now(),
  service_type text NOT NULL,
  resolved boolean DEFAULT false
);

-- Создание таблицы jamming_records
CREATE TABLE IF NOT EXISTS jamming_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roller_number integer NOT NULL,
  line_number integer NOT NULL,
  reason text NOT NULL,
  date timestamptz DEFAULT now(),
  service_type text NOT NULL,
  resolved boolean DEFAULT false
);

-- Создание таблицы shift_notes
CREATE TABLE IF NOT EXISTS shift_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  date timestamptz DEFAULT now(),
  author_role text NOT NULL
);

-- Включение RLS
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE jamming_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_notes ENABLE ROW LEVEL SECURITY;

-- Создание политик для maintenance_records
CREATE POLICY "Enable read access for authenticated users" ON maintenance_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON maintenance_records
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON maintenance_records
  FOR UPDATE TO authenticated USING (true);

-- Создание политик для jamming_records
CREATE POLICY "Enable read access for authenticated users" ON jamming_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON jamming_records
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON jamming_records
  FOR UPDATE TO authenticated USING (true);

-- Создание политик для shift_notes
CREATE POLICY "Enable read access for authenticated users" ON shift_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON shift_notes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable delete for note authors" ON shift_notes
  FOR DELETE TO authenticated USING (true);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS maintenance_records_roller_idx 
  ON maintenance_records(roller_number, line_number);

CREATE INDEX IF NOT EXISTS jamming_records_roller_idx 
  ON jamming_records(roller_number, line_number);

CREATE INDEX IF NOT EXISTS maintenance_records_date_idx 
  ON maintenance_records(date DESC);

CREATE INDEX IF NOT EXISTS jamming_records_date_idx 
  ON jamming_records(date DESC);

CREATE INDEX IF NOT EXISTS shift_notes_date_idx 
  ON shift_notes(date DESC);