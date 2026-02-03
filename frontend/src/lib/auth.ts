import { createSupabaseClient } from './supabase';
import { apiClient } from './api/client';

/**
 * Logout the current user and redirect to login page
 * 
 * @param redirectPath - Optional path to redirect after logout (defaults to /login)
 */
export const logout = async (redirectPath: string = '/login') => {
  const supabase = createSupabaseClient();
  
  try {
    // Notify backend to remove session from active sessions
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if backend call fails
      console.warn('Failed to notify backend of logout:', error);
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error during logout:', error);
      throw error;
    }
    
    // Clear any client-side storage if needed
    if (typeof window !== 'undefined') {
      // Force redirect and clear history
      window.location.href = redirectPath;
    }
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 * 
 * @returns Promise<boolean> - true if authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const supabase = createSupabaseClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Get the current user's role
 * 
 * @returns Promise<string | null> - user role or null if not authenticated
 */
export const getCurrentUserRole = async (): Promise<string | null> => {
  const supabase = createSupabaseClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    return profile?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};
