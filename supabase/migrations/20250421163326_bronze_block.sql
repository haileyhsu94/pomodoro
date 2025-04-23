/*
  # Fix Tasks RLS Policies

  1. Changes
    - Drop existing RLS policies for tasks table
    - Create new, properly configured RLS policies for tasks table
    
  2. Security
    - Enable RLS on tasks table
    - Add policies for CRUD operations
    - Ensure authenticated users can only access their own tasks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for own tasks" ON tasks;
DROP POLICY IF EXISTS "Enable insert for own tasks" ON tasks;
DROP POLICY IF EXISTS "Enable read access for own tasks" ON tasks;
DROP POLICY IF EXISTS "Enable update for own tasks" ON tasks;

-- Recreate policies with proper conditions
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