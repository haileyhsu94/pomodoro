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
          }, `Starting in ${formatDistanceToNow(new Date(task.scheduled_for!))}`)
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

export interface TaskState {
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
        set({ loading: true });
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          set({ loading: false });
          return;
        }

        try {
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.user.id)
            .order('created_at', { ascending: false });

          if (tasksError) throw tasksError;

          const { data: folders, error: foldersError } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.user.id)
            .order('created_at', { ascending: true });

          if (foldersError) throw foldersError;

          set({ 
            tasks: tasks || [], 
            folders: folders || [],
            loading: false 
          });
        } catch (error) {
          console.error('Error fetching data:', error);
          set({ loading: false });
        }
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
        
        const newTask: Task = {
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
          reminder_time: reminderEnabled ? reminderTime : undefined,
          created_at: new Date().toISOString()
        };

        // Always update local state first
        set((state) => ({ tasks: [newTask, ...state.tasks] }));

        // If authenticated, save to Supabase
        if (user.user) {
          try {
            const { error } = await supabase
              .from('tasks')
              .insert(newTask)
              .select()
              .single();

            if (error) {
              console.error('Error saving task to Supabase:', error);
              // Don't throw error to allow local-only operation
            }
          } catch (error) {
            console.error('Error in Supabase operation:', error);
            // Don't throw error to allow local-only operation
          }
        }

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
            t.id === id ? { ...t, started_at: now.toISOString() } : t
          ),
        }));
      },

      finishTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || !task.started_at) return;

        const timeSpent = Math.floor((Date.now() - new Date(task.started_at).getTime()) / 1000);
        
        const { error } = await supabase.rpc('update_task_time_spent', {
          task_id: id,
          seconds_spent: timeSpent,
        });

        if (error) throw error;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, started_at: undefined, time_spent: (t.time_spent || 0) + timeSpent } : t
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
            t.id === id ? { ...t, time_spent: (t.time_spent || 0) + seconds } : t
          ),
        }));
      },

      updateTask: async (id, updates: Partial<Task>) => {
        const dbUpdates: Record<string, any> = {};
        
        // Handle non-date fields directly
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
        if (updates.estimated_pomodoros !== undefined) dbUpdates.estimated_pomodoros = updates.estimated_pomodoros;
        if (updates.duration !== undefined) dbUpdates.duration = updates.duration || 25;
        if (updates.folder_id !== undefined) dbUpdates.folder_id = updates.folder_id;
        if (updates.time_spent !== undefined) dbUpdates.time_spent = updates.time_spent;
        if (updates.notified !== undefined) dbUpdates.notified = updates.notified;
        if (updates.reminder_enabled !== undefined) dbUpdates.reminder_enabled = updates.reminder_enabled;
        if (updates.reminder_time !== undefined) dbUpdates.reminder_time = updates.reminder_time;
        
        // Handle date fields with extra validation
        if (updates.scheduled_for !== undefined) {
          const formattedScheduledFor = formatTimestamp(updates.scheduled_for);
          if (updates.scheduled_for && !formattedScheduledFor) {
            throw new Error('Invalid scheduled time format');
          }
          dbUpdates.scheduled_for = formattedScheduledFor;
        }
        
        if (updates.started_at !== undefined) {
          const formattedStartedAt = formatTimestamp(updates.started_at);
          if (updates.started_at && !formattedStartedAt) {
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
            t.folder_id === id ? { ...t, folder_id: undefined } : t
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
            task.scheduled_for &&
            !task.completed &&
            !task.notified &&
            task.reminder_enabled &&
            new Date(task.scheduled_for).getTime() - now.getTime() <= (task.reminder_time || 15) * 60 * 1000 &&
            new Date(task.scheduled_for).getTime() - now.getTime() > 0
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
      name: 'task-storage',
      partialize: (state) => ({ 
        tasks: state.tasks,
        folders: state.folders
      }),
      onRehydrateStorage: () => (state) => {
        // Fetch fresh data from Supabase when the store is rehydrated
        if (state) {
          state.fetchTasks();
        }
      }
    }
  )
);

// Initialize data fetching
if (typeof window !== 'undefined') {
  // Fetch tasks initially
  useTaskStore.getState().fetchTasks();
  
  // Set up real-time subscription for tasks
  const tasksSubscription = supabase
    .channel('tasks-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks'
      },
      () => {
        useTaskStore.getState().fetchTasks();
      }
    )
    .subscribe();

  // Check for upcoming tasks every minute
  setInterval(() => {
    useTaskStore.getState().checkUpcomingTasks();
  }, 60000);
}