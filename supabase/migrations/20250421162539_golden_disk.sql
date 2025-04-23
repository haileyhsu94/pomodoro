/*
  # Update RLS policies for folders table

  1. Changes
    - Drop existing RLS policies for folders table
    - Create new granular policies for CRUD operations
    - Add time_spent column to tasks table
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own folders" ON folders;
  DROP POLICY IF EXISTS "Enable read for authenticated users" ON folders;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON folders;
  DROP POLICY IF EXISTS "Enable update for folder owners" ON folders;
  DROP POLICY IF EXISTS "Enable delete for folder owners" ON folders;
END $$;

-- Create new granular policies
CREATE POLICY "Enable read for authenticated users" 
  ON folders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" 
  ON folders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for folder owners" 
  ON folders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for folder owners" 
  ON folders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add time_spent column to tasks if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'time_spent'
  ) THEN
    ALTER TABLE tasks ADD COLUMN time_spent integer DEFAULT 0;
  END IF;
END $$;