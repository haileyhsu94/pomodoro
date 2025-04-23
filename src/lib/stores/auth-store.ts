import { create } from 'zustand';
import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: { full_name: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signUp: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
  updateProfile: async (profile: { full_name: string }) => {
    const { error } = await supabase.auth.updateUser({
      data: profile
    });
    if (error) throw error;
    set((state) => ({
      user: state.user ? {
        ...state.user,
        user_metadata: {
          ...state.user.user_metadata,
          ...profile
        }
      } : null
    }));
  },
}));

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.setState({
    user: session?.user ?? null,
    loading: false,
  });
});

// Get initial session
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.setState({
    user: session?.user ?? null,
    loading: false,
  });
});