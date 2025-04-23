import { create } from 'zustand';
import { Stats } from '../types';
import { supabase } from '../supabase';
import { useAuthStore } from './auth-store';

interface StatsState extends Stats {
  loading: boolean;
  fetchStats: () => Promise<void>;
  incrementFocusTime: (minutes: number) => Promise<void>;
  incrementCompletedTasks: () => Promise<void>;
  incrementPomodoros: () => Promise<void>;
  incrementStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
  focusTime: 0,
  completedTasks: 0,
  totalPomodoros: 0,
  currentStreak: 0,
  loading: true,

  fetchStats: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data: stats, error } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    set({
      focusTime: stats.focus_time,
      completedTasks: stats.completed_tasks,
      totalPomodoros: stats.total_pomodoros,
      currentStreak: stats.current_streak,
      loading: false,
    });
  },

  incrementFocusTime: async (minutes) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase.rpc('increment_focus_time', {
      minutes_to_add: minutes,
    });

    if (error) throw error;
    set((state) => ({ focusTime: state.focusTime + minutes }));
  },

  incrementCompletedTasks: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase.rpc('increment_completed_tasks');

    if (error) throw error;
    set((state) => ({ completedTasks: state.completedTasks + 1 }));
  },

  incrementPomodoros: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase.rpc('increment_total_pomodoros');

    if (error) throw error;
    set((state) => ({ totalPomodoros: state.totalPomodoros + 1 }));
  },

  incrementStreak: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase.rpc('increment_streak');

    if (error) throw error;
    set((state) => ({ currentStreak: state.currentStreak + 1 }));
  },

  resetStreak: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase.rpc('reset_streak');

    if (error) throw error;
    set({ currentStreak: 0 });
  },
}));

// Initialize stats when auth state changes
useAuthStore.subscribe((state) => {
  if (state.user && !state.loading) {
    useStatsStore.getState().fetchStats();
  }
});