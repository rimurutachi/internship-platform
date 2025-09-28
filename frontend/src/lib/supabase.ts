import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types';

export const createSupabaseClient = () => {
    return createClientComponentClient<Database>();
};

export const createSupabaseServer = () => {
    return createServerComponentClient<Database>({ cookies });
};

// Utitilies
export const getCurrentUser = async() => {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile;
};