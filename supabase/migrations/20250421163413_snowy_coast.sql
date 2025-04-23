/*
  # Fix Tasks RLS Policies

  1. Changes
    - Drop existing RLS policies for tasks table
    - Create new, more robust RLS policies for tasks table
    
  2. Security
    - Enable RLS on tasks table (already enabled)
    - Add comprehensive policies for all CRUD operations
    - Ensure proper user_id checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for own tasks" ON tasks;
DROP POLICY IF EXISTS "Enable insert for own tasks" ON tasks;
DROP POLICY IF EXISTS "Enable read access for own tasks" ON tasks;
DROP POLICY IF EXISTS "Enable update for own tasks" ON tasks;

-- Create new policies with better definitions
CREATE POLICY "Enable read access for own tasks"
ON tasks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for own tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own tasks"
ON tasks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own tasks"
ON tasks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);