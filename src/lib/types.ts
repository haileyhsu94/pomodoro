export interface Task {
  id: string;
  title: string;
  completed: boolean;
  pomodoros: number;
  estimatedPomodoros: number;
  createdAt: Date;
  scheduledFor?: Date;
  folderId?: string;
  duration: number; // in minutes
  notified?: boolean;
  timeSpent: number; // in seconds
  startedAt?: Date;
  reminderEnabled: boolean;
  reminderTime?: number; // minutes before scheduled time
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