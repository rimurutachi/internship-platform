import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types';

/**
 * Creates a Supabase client for client-side components
 *
 * @returns Supabase client instance for client components
 */
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>();
};