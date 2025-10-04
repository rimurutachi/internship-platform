'use client';

import { useState } from 'react';
import { User, LoginFormProps} from '@/types';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';

export default function LoginForm({ redirectTo, className}: LoginFormProps) {
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createSupabaseClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                return;
            }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();
        
        // Set user data in state
        setUser({
            id: data.user.id,
            email: data.user.email!,
            role: profile?.role || 'student'
        });
        
        // Use redirectTo prop if provided, otherwise use role-based routing
        if (redirectTo) {
            router.push(redirectTo);
        } else {
            switch (profile?.role) {
                case 'student':
                    router.push('/dashboard/student');
                    break;
                case 'advisor':
                    router.push('/dashboard/advisor');
                    break;
                case 'supervisor':
                    router.push('/dashboard/supervisor');
                    break;
                default:
                    router.push('/dashboard');
            }
        }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login Failed, try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

return (
    <div className={`min-h-screen flex items-center justify-center bg-grey-50 ${className || ''}`}>
        <div className="max-w-md w-full space-y-8">
            <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-grey-900">
                    Sign in to Intern-Galing
                </h2>
                {user && (
                    <p className="mt-2 text-center text-sm text-green-600">
                        Welcome back, {user.email}!
                    </p>
                )}
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="sr-only">
                        Email Address
                    </label>
                    <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="relative block w-full px-3 py-2 border border-grey-300 rounded-md placeholder-gray-500 text-grey-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="sr-only">
                        Password
                    </label>
                    <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="relative block w-full px-3 py-2 border border-grey-300 rounded-md placeholder-gray-500 text-grey-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? 'Signing In...' : 'Sign in'}
                    </button>
                </div>
            </form>
        </div>
    </div>
);
}