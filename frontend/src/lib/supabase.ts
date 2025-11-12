import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database, User } from '@/types';

/**
 * Creates a Supabase client for client-side components
 * 
 * @returns Supabase client instance for client components
 */
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>();
};

/**
 * Creates a Supabase client for server-side components
 * 
 * @returns Supabase client instance for server components
 */
export const createSupabaseServer = () => {
  return createServerComponentClient<Database>({ cookies });
};

/**
 * Gets the current authenticated user with their profile data
 * 
 * @returns User profile data if authenticated, null otherwise
 * @throws Error if there's an issue fetching the user profile
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error getting authenticated user:', authError);
      return null;
    }
    
    if (!user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    return profile as User;
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
    return null;
  }
};