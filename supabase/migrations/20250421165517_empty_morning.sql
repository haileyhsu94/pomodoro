/*
  # Add increment_focus_time stored procedure

  1. New Functions
    - `increment_focus_time(minutes_to_add integer)`
      - Increments the focus_time field in the stats table for the authenticated user
      - Updates the last_activity_date to the current date
      - Returns void

  2. Security
    - Function is only accessible to authenticated users
*/

CREATE OR REPLACE FUNCTION public.increment_focus_time(minutes_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stats
  SET 
    focus_time = focus_time + minutes_to_add,
    last_activity_date = CURRENT_DATE
  WHERE user_id = auth.uid();
END;
$$;