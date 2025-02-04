/*
  # Add service type to shift notes

  1. Changes
    - Add service_type column to shift_notes table
    - Add index for service_type
    - Update RLS policies
*/

-- Add service_type column
ALTER TABLE shift_notes 
ADD COLUMN IF NOT EXISTS service_type text;

-- Create index for service_type
CREATE INDEX IF NOT EXISTS shift_notes_service_type_idx 
ON shift_notes(service_type);

-- Update RLS policies
DROP POLICY IF EXISTS "Enable all access for all users" ON shift_notes;

CREATE POLICY "Enable read access for all users" ON shift_notes
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON shift_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for note owners" ON shift_notes
  FOR DELETE USING (
    (auth.uid() IS NOT NULL) AND
    (
      service_type IS NULL OR
      service_type = (
        SELECT service_type 
        FROM auth.users 
        WHERE id = auth.uid()
      )
    )
  );