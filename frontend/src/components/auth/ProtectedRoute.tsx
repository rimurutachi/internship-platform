'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'advisor' | 'supervisor' | 'admin';
}

/**
 * ProtectedRoute Component
 * 
 * Protects routes from unauthenticated access and enforces role-based access control.
 * Redirects to login if not authenticated or if user role doesn't match required role.
 * 
 * @param children - The protected content to render
 * @param requiredRole - Optional role requirement for accessing this route
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.replace('/login');
          return;
        }

        // If role is required, check user role
        if (requiredRole) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role !== requiredRole) {
            // Redirect to correct dashboard based on user's actual role
            router.replace(`/dashboard/${profile?.role || 'student'}`);
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-in">
          <div className="w-12 h-12 rounded-xl bg-muted skeleton-shimmer mx-auto" />
          <div className="h-4 w-32 bg-muted rounded skeleton-shimmer mx-auto" />
          <div className="h-3 w-24 bg-muted rounded skeleton-shimmer mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
