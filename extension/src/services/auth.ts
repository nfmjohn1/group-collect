import { supabase } from './supabase';
import { storage } from './storage';
import type { User } from '@/shared/types';

/**
 * Authentication service using Supabase
 */

export const authService = {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user && data.session) {
      // Store user and session in Chrome storage
      await storage.setUser({
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
      });
      await storage.setSession(data.session);
    }

    return data;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user && data.session) {
      // Store user and session in Chrome storage
      await storage.setUser({
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
      });
      await storage.setSession(data.session);
    }

    return data;
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: chrome.identity.getRedirectURL(),
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Clear Chrome storage
    await storage.removeUser();
    await storage.removeSession();
  },

  /**
   * Get current user from storage
   */
  async getCurrentUser(): Promise<User | null> {
    return storage.getUser();
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
  },

  /**
   * Refresh session
   */
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) throw error;

    if (data.session) {
      await storage.setSession(data.session);
    }

    return data.session;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await storage.getUser();
    return !!user;
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;
    return data;
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },
};
