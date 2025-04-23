/*
  # Fix increment_pomodoro function

  1. Changes
    - Create two separate functions for incrementing pomodoros:
      - `increment_pomodoro(task_id)`: Increments pomodoro count for a specific task
      - `increment_total_pomodoros()`: Increments total pomodoros in user stats
  
  2. Security
    - Both functions are secured to only allow authenticated users
    - Each function only allows users to modify their own data
*/

-- Function to increment pomodoro count for a specific task
CREATE OR REPLACE FUNCTION increment_pomodoro(task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tasks 
  SET pomodoros = COALESCE(pomodoros, 0) + 1
  WHERE id = task_id 
  AND user_id = auth.uid();
END;
$$;

-- Function to increment total pomodoros in user stats
CREATE OR REPLACE FUNCTION increment_total_pomodoros()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stats 
  SET total_pomodoros = COALESCE(total_pomodoros, 0) + 1
  WHERE user_id = auth.uid();
END;
$$;