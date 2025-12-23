import { supabase } from './supabaseClient';
import { Session, User, AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0],
      },
    },
  });

  if (error) {
    return { user: null, session: null, error };
  }

  // Create profile record if user was created
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      name: name || email.split('@')[0],
    });

    if (profileError) {
      console.warn('Failed to create profile:', profileError.message);
    }
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data.user, session: data.session, error };
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Reset password
 */
export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error };
}

/**
 * Get user profile from profiles table
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Failed to fetch profile:', error.message);
    return null;
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: { name?: string; avatar_url?: string }
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data;
}



