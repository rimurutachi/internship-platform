'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { getUserProfile } from '@/lib/api/services/user';
import { createSupabaseClient } from '@/lib/supabase';
import type { User } from '@/types';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing user profile data
 * 
 * @returns User profile data, loading state, error, and refetch function
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, try to get user from backend
      const userData = await getUserProfile();
      setUser(userData);
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      
      // If profile not found (404), create a fallback from Supabase auth
      if (err.statusCode === 404) {
        try {
          const supabase = createSupabaseClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Create a temporary user object from Supabase auth
            const fallbackUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              role: (session.user.user_metadata?.role || session.user.app_metadata?.role || 'student') as 'student' | 'advisor' | 'supervisor' | 'admin',
              first_name: session.user.user_metadata?.first_name || session.user.email?.split('@')[0],
              last_name: session.user.user_metadata?.last_name,
              profile_data: session.user.user_metadata?.profile_data,
            };
            
            setUser(fallbackUser);
            console.warn('Using fallback user data from Supabase Auth. User profile not found in database.');
            return;
          }
        } catch (supabaseErr) {
          console.error('Failed to get fallback user from Supabase:', supabaseErr);
        }
      }
      
      setError(err instanceof Error ? err : new Error('Failed to fetch user profile'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
}
