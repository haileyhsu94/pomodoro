/*
  # Add notification support for tasks

  1. Changes
    - Add `notified` column to tasks table to track notification status
    - Default value is false
    - Allow null values for backward compatibility
*/

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS notified boolean DEFAULT false;