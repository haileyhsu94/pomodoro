/*
  # Add time tracking to tasks

  1. Changes
    - Add `time_spent` column to tasks table (in seconds)
    - Add `started_at` column to tasks table
    - Add function to update time spent
*/

-- Add new columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS time_spent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- Create function to update time spent
CREATE OR REPLACE FUNCTION update_task_time_spent(
  task_id uuid,
  seconds_spent integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tasks
  SET time_spent = time_spent + seconds_spent
  WHERE id = task_id;
END;
$$;