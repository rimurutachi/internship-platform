'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { createSupabaseClient } from '@/lib/supabase';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch user role and redirect to appropriate dashboard
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        const userRole = profile?.role || 'student';
        router.replace(`/dashboard/${userRole}`);
      }
    };
    checkSession();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image 
              src="/cvsu-logo.png" 
              alt="CvSU Logo" 
              width={40} 
              height={40}
              className="object-contain"
            />
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                CAVITE STATE UNIVERSITY - BACOOR CITY CAMPUS
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Image 
              src="/logo.png" 
              alt="Intern-Galing Logo" 
              width={32} 
              height={32}
              className="object-contain"
            />
            <Image 
              src="/bagong-pilipinas-logo.png" 
              alt="Bagong Pilipinas Logo" 
              width={32} 
              height={32}
              className="object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Login Card - Subtle card with accent border */}
          <div className="bg-card rounded-2xl border-2 border-primary/30 p-8 shadow-xl dark:bg-card/95 dark:border-primary/40">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Image 
                  src="/cvsu-logo.png" 
                  alt="CvSU Logo" 
                  width={64} 
                  height={64}
                  className="object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                CAVITE STATE UNIVERSITY<br />
                BACOOR CITY CAMPUS
              </h1>
              <h2 className="text-3xl font-bold text-primary mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Sign in to access your dashboard.</p>
            </div>

            {/* Login Form */}
            <LoginForm />

            <div className="text-center mt-6">
              <Link href="/forgot-password" className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-6 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Image 
              src="/cvsu-logo.png" 
              alt="CvSU Logo" 
              width={24} 
              height={24}
              className="object-contain"
            />
            <span className="text-base font-semibold text-foreground">CvSU Bacoor</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 Cavite State University - Bacoor City Campus. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

