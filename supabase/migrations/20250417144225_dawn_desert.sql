/*
  # Initial Schema for Pomodoro App

  1. New Tables
    - `folders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `color` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `completed` (boolean)
      - `pomodoros` (integer)
      - `estimated_pomodoros` (integer)
      - `duration` (integer)
      - `scheduled_for` (timestamp)
      - `folder_id` (uuid, references folders)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

    - `stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `focus_time` (integer)
      - `completed_tasks` (integer)
      - `total_pomodoros` (integer)
      - `current_streak` (integer)
      - `last_activity_date` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folders"
  ON folders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  completed boolean DEFAULT false,
  pomodoros integer DEFAULT 0,
  estimated_pomodoros integer NOT NULL,
  duration integer NOT NULL,
  scheduled_for timestamptz,
  folder_id uuid REFERENCES folders ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create stats table
CREATE TABLE IF NOT EXISTS stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  focus_time integer DEFAULT 0,
  completed_tasks integer DEFAULT 0,
  total_pomodoros integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  last_activity_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own stats"
  ON stats
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to initialize stats for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.stats (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize stats for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();