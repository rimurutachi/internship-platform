'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginFormProps } from '@/types';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * LoginForm Component
 * 
 * Handles user authentication and redirects based on user role.
 * 
 * @param redirectTo - Optional custom redirect path after login
 * @param className - Optional additional CSS classes
 */
export default function LoginForm({ redirectTo, className, selectedRole }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createSupabaseClient();

  /**
   * Handles form submission and user authentication
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('Authentication failed. Please try again.');
        return;
      }

      // Fetch user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setError('Failed to load user profile. Please try again.');
        return;
      }

      // Role-based authentication: only allow login if user role matches selectedRole
      if (selectedRole && profile?.role !== selectedRole) {
        setError('You are not allowed to log in as this role. Please select the correct role.');
        await supabase.auth.signOut(); // sign out the session
        return;
      }

      // Redirect based on redirectTo prop or user role
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        const role = profile?.role || 'student';
        const roleRoutes: Record<string, string> = {
          student: '/dashboard/student',
          advisor: '/dashboard/advisor',
          supervisor: '/dashboard/supervisor',
          admin: '/dashboard/admin',
        };
        router.push(roleRoutes[role] || '/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className || ''}`}>
      {error && (
        <div 
          className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-foreground mb-2 block">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}