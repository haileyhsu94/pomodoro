/*
  # Fix Tasks Table RLS Policies

  1. Changes
    - Drop existing ALL policy and replace with specific policies for each operation
    - Add separate policies for SELECT, INSERT, UPDATE, and DELETE operations
    - Ensure proper user_id checks for all operations

  2. Security
    - Enable RLS on tasks table (already enabled)
    - Add granular policies for better security control
    - Ensure users can only access their own tasks
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;

-- Create specific policies for each operation
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