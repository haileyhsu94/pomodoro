export interface Task {
  id: string;
  title: string;
  completed: boolean;
  pomodoros: number;
  estimated_pomodoros: number;
  created_at: string;
  scheduled_for?: string | null;
  folder_id?: string;
  duration: number; // in minutes
  notified?: boolean;
  time_spent: number; // in seconds
  started_at?: string;
  reminder_enabled: boolean;
  reminder_time?: number; // minutes before scheduled time
  user_id?: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Stats {
  focusTime: number; // in minutes
  completedTasks: number;
  totalPomodoros: number;
  currentStreak: number;
}