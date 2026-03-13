'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginFormProps } from '@/types';
import { createSupabaseClient } from '@/lib/supabase';
import { apiClient } from '@/lib/api';

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
      // Call backend login API (which updates last_login)
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const loginData = response.data;

      if (!loginData.success) {
        setError(loginData.message || 'Login failed');
        return;
      }

      // Set the session in Supabase client
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: loginData.data.access_token,
        refresh_token: loginData.data.refresh_token,
      });

      if (sessionError) {
        setError('Failed to establish session');
        return;
      }

      // Get user role from response - automatically detect role
      const userRole = loginData.data.user?.role || 'student';

      // Redirect based on redirectTo prop or automatically based on user's actual role
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        const roleRoutes: Record<string, string> = {
          student: '/dashboard/student',
          advisor: '/dashboard/advisor',
          supervisor: '/dashboard/supervisor',
          admin: '/dashboard/admin',
        };
        router.push(roleRoutes[userRole] || '/dashboard');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className || ''}`}>
      {error && (
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-0 top-0 h-full w-12 bg-primary rounded-l-md flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full pl-14 pr-4 py-3 border-2 border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 h-full w-12 bg-primary rounded-l-md flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full pl-14 pr-4 py-3 border-2 border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
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
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {loading ? 'Signing In...' : 'Login'}
      </button>
    </form>
  );
}