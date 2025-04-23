/*
  # Add reminder time column to tasks table

  1. Changes
    - Add `reminder_time` column to `tasks` table
      - Type: timestamptz (timestamp with time zone)
      - Nullable: true (not all tasks will have reminders)

  2. Notes
    - This column will store the specific time when a task reminder should be triggered
    - Works in conjunction with existing reminder_enabled boolean field
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'reminder_time'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN reminder_time timestamptz;
  END IF;
END $$;