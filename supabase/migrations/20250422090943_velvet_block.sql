/*
  # Add reminder_enabled column to tasks table

  1. Changes
    - Add `reminder_enabled` column to `tasks` table with boolean type and default value of false
    
  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Sets default value to false to ensure consistency with existing rows
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'reminder_enabled'
  ) THEN 
    ALTER TABLE tasks 
    ADD COLUMN reminder_enabled boolean DEFAULT false;
  END IF;
END $$;