import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import {
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  getSession,
  onAuthStateChange,
  getUserProfile,
} from '../lib/authApi';

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setProfile: (profile: Profile | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  profile: null,
  session: null,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get current session
      const session = await getSession();

      if (session?.user) {
        // Fetch user profile
        const profile = await getUserProfile(session.user.id);

        set({
          isAuthenticated: true,
          user: session.user,
          session,
          profile: profile
            ? {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                avatar_url: profile.avatar_url,
              }
            : null,
          isLoading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          session: null,
          profile: null,
          isLoading: false,
        });
      }

      // Listen for auth changes
      onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await getUserProfile(session.user.id);
          set({
            isAuthenticated: true,
            user: session.user,
            session,
            profile: profile
              ? {
                  id: profile.id,
                  email: profile.email,
                  name: profile.name,
                  avatar_url: profile.avatar_url,
                }
              : null,
          });
        } else if (event === 'SIGNED_OUT') {
          set({
            isAuthenticated: false,
            user: null,
            session: null,
            profile: null,
          });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, error: 'Failed to initialize auth' });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const { user, session, error } = await apiSignIn(email, password);

      if (error) {
        set({ isLoading: false, error: error.message });
        return false;
      }

      if (user) {
        const profile = await getUserProfile(user.id);
        set({
          isAuthenticated: true,
          user,
          session,
          profile: profile
            ? {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                avatar_url: profile.avatar_url,
              }
            : null,
          isLoading: false,
        });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      });
      return false;
    }
  },

  signUp: async (email: string, password: string, name?: string) => {
    try {
      set({ isLoading: true, error: null });

      const { user, session, error } = await apiSignUp(email, password, name);

      if (error) {
        set({ isLoading: false, error: error.message });
        return false;
      }

      if (user) {
        // Note: Supabase may require email confirmation
        // In that case, session will be null until confirmed
        if (session) {
          const profile = await getUserProfile(user.id);
          set({
            isAuthenticated: true,
            user,
            session,
            profile: profile
              ? {
                  id: profile.id,
                  email: profile.email,
                  name: profile.name,
                  avatar_url: profile.avatar_url,
                }
              : null,
            isLoading: false,
          });
        } else {
          // Email confirmation required
          set({
            isLoading: false,
            error: null,
          });
        }
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Sign up error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      });
      return false;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      await apiSignOut();
      set({
        isAuthenticated: false,
        user: null,
        session: null,
        profile: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      });
    }
  },

  clearError: () => set({ error: null }),

  setProfile: (profile) => set({ profile }),
}));
