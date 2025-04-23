import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Folder } from '../types';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';

// Separate component for the toast notification
const TaskToast = ({ 
  task, 
  visible, 
  toastId, 
  onStart, 
  onDismiss 
}: { 
  task: Task; 
  visible: boolean; 
  toastId: string; 
  onStart: () => void; 
  onDismiss: (id: string) => void;
}) => {
  return React.createElement('div', {
    className: `${visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`
  }, [
    React.createElement('div', { 
      key: 'content',
      className: 'flex-1 w-0 p-4' 
    }, [
      React.createElement('div', { 
        key: 'inner',
        className: 'flex items-start' 
      }, [
        React.createElement('div', { 
          key: 'text',
          className: 'ml-3 flex-1' 
        }, [
          React.createElement('p', { 
            key: 'title',
            className: 'text-sm font-medium text-gray-900' 
          }, `Upcoming Task: ${task.title}`),
          React.createElement('p', { 
            key: 'time',
            className: 'mt-1 text-sm text-gray-500' 
          }, `Starting in ${formatDistanceToNow(new Date(task.scheduledFor!))}`)
        ])
      ])
    ]),
    React.createElement('div', { 
      key: 'actions',
      className: 'flex border-l border-gray-200' 
    }, [
      React.createElement('button', {
        key: 'start-button',
        onClick: () => {
          onStart();
          onDismiss(toastId);
        },
        className: 'w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-[#9F353A] hover:text-[#9F353A]/80 focus:outline-none'
      }, 'Start Now')
    ])
  ]);
};

interface TaskState {
  tasks: Task[];
  folders: Folder[];
  loading: boolean;
  activeTab: 'home' | 'tasks' | 'timer' | 'achievements';
  setActiveTab: (tab: 'home' | 'tasks' | 'timer' | 'achievements') => void;
  addTask: (
    title: string,
    estimatedPomodoros: number,
    duration: number,
    scheduledFor?: Date,
    folderId?: string,
    reminderEnabled?: boolean,
    reminderTime?: number
  ) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  incrementPomodoro: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  addFolder: (name: string, color: string) => Promise<void>;
  removeFolder: (id: string) => Promise<void>;
  updateFolder: (id: string, name: string, color: string) => Promise<void>;
  startTask: (id: string) => Promise<void>;
  finishTask: (id: string) => Promise<void>;
  updateTimeSpent: (id: string, seconds: number) => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  checkUpcomingTasks: () => void;
}

// Helper function to validate and format timestamp
const formatTimestamp = (value: any): string | null => {
  if (!value) return null;
  
  try {
    // If it's already a Date object
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      return value.toISOString();
    }
    
    // If it's a number (timestamp)
    if (typeof value === 'number') {
      // Ensure the number is a valid timestamp (milliseconds since epoch)
      // Minimum date: January 1, 2020
      // Maximum date: December 31, 2030
      if (value < 1577836800000 || value > 1924905600000) {
        console.warn('Invalid timestamp value:', value);
        return null;
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    }
    
    // If it's a string
    if (typeof value === 'string') {
      // Check if it's just a number as a string
      if (!isNaN(Number(value))) {
        console.warn('Numeric string provided as timestamp:', value);
        return null;
      }
      
      // Try to parse the string as a date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    console.warn('Invalid timestamp format:', value);
    return null;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return null;
  }
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      folders: [],
      loading: true,
      activeTab: 'home',

      setActiveTab: (tab) => set({ activeTab: tab }),

      fetchTasks: async () => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          // If not authenticated, use local storage data
          return;
        }

        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        set({ tasks: tasks || [], loading: false });
      },

      fetchFolders: async () => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          // If not authenticated, use local storage data
          return;
        }

        const { data: folders, error } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        set({ folders: folders || [], loading: false });
      },

      addTask: async (title, estimatedPomodoros, duration, scheduledFor, folderId, reminderEnabled = false, reminderTime = 15) => {
        const { data: user } = await supabase.auth.getUser();
        const taskDuration = duration || 25;
        const formattedScheduledFor = formatTimestamp(scheduledFor);
        
        const newTask = {
          id: crypto.randomUUID(),
          title,
          estimated_pomodoros: estimatedPomodoros,
          duration: taskDuration,
          scheduled_for: formattedScheduledFor,
          folder_id: folderId,
          time_spent: 0,
          pomodoros: 0,
          completed: false,
          user_id: user.user?.id,
          notified: false,
          reminder_enabled: reminderEnabled,
          reminder_time: reminderEnabled ? reminderTime : null,
          created_at: new Date().toISOString()
        };

        if (user.user) {
          // If authenticated, save to Supabase
          const { error } = await supabase
            .from('tasks')
            .insert(newTask)
            .select()
            .single();

          if (error) throw error;
        }

        // Always update local state
        set((state) => ({ tasks: [newTask, ...state.tasks] }));

        if (formattedScheduledFor && reminderEnabled) {
          toast.success(
            `Task scheduled for ${formatDistanceToNow(new Date(formattedScheduledFor), { addSuffix: true })}. You'll be notified ${reminderTime} minutes before.`,
            { duration: 5000 }
          );
        }
      },

      toggleTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const { error } = await supabase
          .from('tasks')
          .update({ completed: !task.completed })
          .eq('id', id);

        if (error) throw error;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
      },

      removeTask: async (id) => {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);

        if (error) throw error;
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      incrementPomodoro: async (id) => {
        const { error } = await supabase.rpc('increment_pomodoro', { task_id: id });

        if (error) throw error;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, pomodoros: t.pomodoros + 1 } : t
          ),
        }));
      },

      startTask: async (id) => {
        const now = new Date();
        const { error } = await supabase
          .from('tasks')
          .update({ started_at: now.toISOString() })
          .eq('id', id);

        if (error) throw error;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, startedAt: now } : t
          ),
        }));
      },

      finishTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || !task.startedAt) return;

        const timeSpent = Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000);
        
        const { error } = await supabase.rpc('update_task_time_spent', {
          task_id: id,
          seconds_spent: timeSpent,
        });

        if (error) throw error;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, startedAt: undefined, timeSpent: (t.timeSpent || 0) + timeSpent } : t
          ),
        }));
      },

      updateTimeSpent: async (id, seconds) => {
        const { error } = await supabase.rpc('update_task_time_spent', {
          task_id: id,
          seconds_spent: seconds,
        });

        if (error) throw error;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, timeSpent: (t.timeSpent || 0) + seconds } : t
          ),
        }));
      },

      updateTask: async (id, updates) => {
        const dbUpdates: Record<string, any> = {};
        
        // Handle non-date fields directly
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
        if (updates.estimatedPomodoros !== undefined) dbUpdates.estimated_pomodoros = updates.estimatedPomodoros;
        if (updates.duration !== undefined) dbUpdates.duration = updates.duration || 25;
        if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;
        if (updates.timeSpent !== undefined) dbUpdates.time_spent = updates.timeSpent;
        if (updates.notified !== undefined) dbUpdates.notified = updates.notified;
        if (updates.reminderEnabled !== undefined) dbUpdates.reminder_enabled = updates.reminderEnabled;
        if (updates.reminderTime !== undefined) dbUpdates.reminder_time = updates.reminderTime;
        
        // Handle date fields with extra validation
        if (updates.scheduledFor !== undefined) {
          const formattedScheduledFor = formatTimestamp(updates.scheduledFor);
          if (updates.scheduledFor && !formattedScheduledFor) {
            throw new Error('Invalid scheduled time format');
          }
          dbUpdates.scheduled_for = formattedScheduledFor;
        }
        
        if (updates.startedAt !== undefined) {
          const formattedStartedAt = formatTimestamp(updates.startedAt);
          if (updates.startedAt && !formattedStartedAt) {
            throw new Error('Invalid start time format');
          }
          dbUpdates.started_at = formattedStartedAt;
        }

        // Only proceed with update if there are valid fields to update
        if (Object.keys(dbUpdates).length > 0) {
          const { error } = await supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', id);

          if (error) throw error;
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          }));
        }
      },

      addFolder: async (name, color) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('User not authenticated');

        const { data: folder, error } = await supabase
          .from('folders')
          .insert({ name, color, user_id: user.user.id })
          .select()
          .single();

        if (error) throw error;
        set((state) => ({ folders: [...state.folders, folder] }));
      },

      removeFolder: async (id) => {
        const { error } = await supabase
          .from('folders')
          .delete()
          .eq('id', id);

        if (error) throw error;
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          tasks: state.tasks.map((t) =>
            t.folderId === id ? { ...t, folderId: undefined } : t
          ),
        }));
      },

      updateFolder: async (id, name, color) => {
        const { error } = await supabase
          .from('folders')
          .update({ name, color })
          .eq('id', id);

        if (error) throw error;
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, name, color } : f
          ),
        }));
      },

      checkUpcomingTasks: () => {
        const { tasks } = get();
        const now = new Date();

        tasks.forEach(task => {
          if (
            task.scheduledFor &&
            !task.completed &&
            !task.notified &&
            task.reminderEnabled &&
            new Date(task.scheduledFor).getTime() - now.getTime() <= (task.reminderTime || 15) * 60 * 1000 &&
            new Date(task.scheduledFor).getTime() - now.getTime() > 0
          ) {
            toast.custom(
              (t) => React.createElement(TaskToast, {
                task,
                visible: t.visible,
                toastId: t.id,
                onStart: () => {
                  get().updateTask(task.id, { notified: true });
                  get().setActiveTab('timer');
                },
                onDismiss: toast.dismiss
              }),
              {
                duration: 10000,
                position: 'top-right',
              }
            );

            get().updateTask(task.id, { notified: true });
          }
        });
      },
    }),
    {
      name: 'task-storage', // name of the item in local storage
      partialize: (state) => ({ 
        tasks: state.tasks,
        folders: state.folders
      })
    }
  )
);

if (typeof window !== 'undefined') {
  setInterval(() => {
    useTaskStore.getState().checkUpcomingTasks();
  }, 60000);
}