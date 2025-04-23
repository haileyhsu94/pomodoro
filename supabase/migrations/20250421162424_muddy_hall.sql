/*
  # Fix tasks table and folders RLS

  1. Changes
    - Add `time_spent` column to tasks table
    - Fix RLS policies for folders table

  2. Security
    - Update RLS policies for folders table to properly handle authenticated users
*/

-- Add time_spent column to tasks table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'time_spent'
  ) THEN
    ALTER TABLE tasks ADD COLUMN time_spent integer DEFAULT 0;
  END IF;
END $$;

-- Drop existing RLS policy for folders
DROP POLICY IF EXISTS "Users can manage their own folders" ON folders;

-- Create new RLS policy for folders that properly handles authenticated users
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