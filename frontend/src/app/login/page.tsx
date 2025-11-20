'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, GraduationCap, BookOpen, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import LoginForm from '@/components/auth/LoginForm';
import { createSupabaseClient } from '@/lib/supabase';

const roles = [
  { id: 'student', label: 'Student', icon: GraduationCap, color: 'bg-primary' },
  { id: 'advisor', label: 'University Advisor', icon: BookOpen, color: 'bg-ai' },
  { id: 'supervisor', label: 'Company Supervisor', icon: Building2, color: 'bg-success' },
  { id: 'admin', label: 'Admin', icon: Brain, color: 'bg-warning' },
];

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'advisor' | 'supervisor' | 'admin'>('student');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-ai/10 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Intern-Galing</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to access your dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Choose your role and enter your credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as 'student' | 'advisor' | 'supervisor' | 'admin')}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${
                        role === r.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-10 h-10 ${r.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <LoginForm selectedRole={role} />

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Need an account?{' '}
              <span className="text-foreground">Contact your administrator</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// ...existing code...

