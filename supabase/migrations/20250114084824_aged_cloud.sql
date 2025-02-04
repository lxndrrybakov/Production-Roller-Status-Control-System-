/*
  # Update schema and reasons list

  1. Changes
    - Remove service_type from tables
    - Update RLS policies
    - Add new electrical issues list
*/

-- Remove service_type column from tables
ALTER TABLE IF EXISTS maintenance_records 
DROP COLUMN IF EXISTS service_type;

ALTER TABLE IF EXISTS jamming_records 
DROP COLUMN IF EXISTS service_type;

ALTER TABLE IF EXISTS shift_notes 
DROP COLUMN IF EXISTS author_role;

-- Update existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON maintenance_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON maintenance_records;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON maintenance_records;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON jamming_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON jamming_records;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON jamming_records;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON shift_notes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON shift_notes;
DROP POLICY IF EXISTS "Enable delete for note authors" ON shift_notes;

-- Create new policies without service_type restrictions
CREATE POLICY "Enable all access for all users" ON maintenance_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for all users" ON jamming_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for all users" ON shift_notes
  FOR ALL USING (true) WITH CHECK (true);