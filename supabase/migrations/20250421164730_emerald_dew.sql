/*
  # Add increment_pomodoro function

  1. New Function
    - `increment_pomodoro(task_id uuid)`
      - Increments pomodoro count for the specified task
      - Updates user stats (total_pomodoros, focus_time)
      - Updates task time_spent based on duration
  
  2. Security
    - Function is accessible to authenticated users only
    - Users can only increment pomodoros for their own tasks
*/

CREATE OR REPLACE FUNCTION public.increment_pomodoro(task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_duration integer;
  task_user_id uuid;
BEGIN
  -- Get task info
  SELECT duration, user_id INTO task_duration, task_user_id
  FROM tasks
  WHERE id = task_id;

  -- Verify user owns the task
  IF task_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Update task
  UPDATE tasks
  SET 
    pomodoros = pomodoros + 1,
    time_spent = time_spent + task_duration
  WHERE id = task_id;

  -- Update user stats
  UPDATE stats
  SET 
    total_pomodoros = total_pomodoros + 1,
    focus_time = focus_time + task_duration,
    last_activity_date = CURRENT_DATE
  WHERE user_id = task_user_id;
END;
$$;