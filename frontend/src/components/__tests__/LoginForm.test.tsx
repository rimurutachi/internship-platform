import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../auth/LoginForm';

//Mock Supabase client
const mockSignIn = jest.fn();
jest.mock('@/lib/supabase', () => ({
    createSupabaseClient: () => ({
        auth: {
            signInWithPassword: mockSignIn,
        },
        from: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
        }),
    }),
}));

describe('LoginForm', () => {
    beforeEach(() => {
        mockSignIn.mockClear();
    });
    test('renders login form elements', () => {
        render(<LoginForm />);

        expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /sign in/i})).toBeInTheDocument();
    });
    test('shows loading state when submitting', async () => {
        const user = userEvent.setup();
        mockSignIn.mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return { data: { user: { id: '123'}}, error: null};
        });
        render(<LoginForm />)

        const emailInput = screen.getByPlaceholderText(/email address/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i});

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        // Wait for loading label to appear and ensure button is disabled
        await waitFor(() => {
            expect(screen.getByRole('button')).toHaveTextContent(/signing in/i);
            expect(screen.getByRole('button')).toBeDisabled();
        });
    });

    test('displays error message on failed login', async () => {
        const user = userEvent.setup();
        mockSignIn.mockResolvedValue({
            data: null,
            error: { message: 'Invalid login credentials' }
        });
        render(<LoginForm />);

        const emailInput = screen.getByPlaceholderText(/email address/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i});

        await user.type(emailInput, 'wrong@example.com');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
        });
    });
});