'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * Smart role-aware redirect for /dashboard/notifications
 * Prevents 404s when navigating directly or from legacy notification links.
 */
export default function DashboardNotificationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const redirectByRole = async () => {
      try {
        const supabase = createSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;
        if (!session) {
          router.replace('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!active) return;
        const role = profile?.role;
        const validRoles = ['student', 'advisor', 'supervisor', 'admin'];
        if (role && validRoles.includes(role)) {
          router.replace(`/dashboard/${role}/notifications`);
        } else {
          router.replace('/dashboard/student/notifications');
        }
      } catch {
        if (active) router.replace('/login');
      }
    };

    redirectByRole();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Opening your notifications...</p>
      </div>
    </div>
  );
}

