/*
  # Add reminder settings to tasks table

  1. Changes
    - Add reminder_enabled column to tasks table (boolean, default false)
    - Add reminder_time column to tasks table (integer, nullable)
    
  2. Notes
    - reminder_enabled determines if a task should show notifications
    - reminder_time specifies how many minutes before the scheduled time to show the notification
*/

ALTER TABLE tasks
ADD COLUMN reminder_enabled boolean DEFAULT false,
ADD COLUMN reminder_time integer;