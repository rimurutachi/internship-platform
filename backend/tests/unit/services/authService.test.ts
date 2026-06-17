import { AuthService } from '../../../src/services/authService';
import { createClient } from '@supabase/supabase-js';

const mockCreateClient = createClient as jest.Mock;
const supabaseAdmin = mockCreateClient.mock.results[0].value;
const supabase = mockCreateClient.mock.results[1].value;

describe('AuthService', () => {
  beforeEach(() => {
    // Reset mocks on the clients
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login and return user and tokens', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'u1', email: 'test@test.com' },
          session: { access_token: 'access123', refresh_token: 'refresh123', expires_at: 1000 },
        },
        error: null,
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'u1', role: 'student', status: 'active', first_name: 'John' },
            error: null,
          }),
        }),
      });

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      supabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'users') {
          return { select: selectMock };
        }
        return {};
      });

      supabaseAdmin.from = jest.fn().mockImplementation(() => ({
        update: updateMock,
      }));

      const response = await AuthService.login({ email: 'test@test.com', password: 'password' });

      expect(response).toHaveProperty('success', true);
      expect((response as any).access_token).toBe('access123');
      expect((response as any).user.role).toBe('student');
    });

    it('should return error if login fails', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const response = await AuthService.login({ email: 'test@test.com', password: 'wrong' });

      expect(response).toHaveProperty('error', 'Login Failed');
      expect((response as any).message).toBe('Invalid credentials');
    });

    it('should sign out and return error if user is suspended', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'u1' },
          session: { access_token: 'tok' },
        },
        error: null,
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'u1', status: 'suspended' },
            error: null,
          }),
        }),
      });

      supabase.from = jest.fn().mockImplementation(() => ({
        select: selectMock,
      }));

      const response = await AuthService.login({ email: 'test@test.com', password: 'password' });

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(response).toHaveProperty('error', 'Account Suspended');
    });

    it('should sign out and return error if user is inactive', async () => {
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'u1' },
          session: { access_token: 'tok' },
        },
        error: null,
      });

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'u1', status: 'inactive' },
            error: null,
          }),
        }),
      });

      supabase.from = jest.fn().mockImplementation(() => ({
        select: selectMock,
      }));

      const response = await AuthService.login({ email: 'test@test.com', password: 'password' });

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(response).toHaveProperty('error', 'Account Inactive');
    });
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'new@test.com',
      password: 'password',
      role: 'student',
      first_name: 'New',
      last_name: 'User',
    };

    it('should register a new user and insert profile', async () => {
      supabaseAdmin.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: 'u2', email: 'new@test.com' } },
        error: null,
      });

      const insertMock = jest.fn().mockResolvedValue({ error: null });
      supabaseAdmin.from = jest.fn().mockImplementation(() => ({
        insert: insertMock,
      }));

      const response = await AuthService.register(validRegisterData as any);

      expect(response).toHaveProperty('success', true);
      expect((response as any).message).toBe('User registered successfully');
      expect((response as any).user.email).toBe('new@test.com');
      expect(insertMock).toHaveBeenCalled();
    });

    it('should return error if auth creation fails', async () => {
      supabaseAdmin.auth.admin.createUser.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already in use' },
      });

      const response = await AuthService.register(validRegisterData as any);

      expect(response).toHaveProperty('error', 'Registration failed.');
      expect((response as any).message).toBe('Email already in use');
    });
  });

  describe('getUserProfile', () => {
    it('should return profile if it exists', async () => {
      const mockProfile = { id: 'u1', email: 'test@test.com' };
      
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      });

      supabaseAdmin.from = jest.fn().mockImplementation(() => ({
        select: selectMock,
      }));

      const response = await AuthService.getUserProfile('u1');
      expect(response).toHaveProperty('success', true);
      expect((response as any).data).toEqual(mockProfile);
    });

    it('should auto-create profile if fallbackUser is provided and profile does not exist', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: { id: 'u1', email: 'fallback@test.com' }, 
            error: null 
          }),
        }),
      });

      supabaseAdmin.from = jest.fn().mockImplementation(() => ({
        select: selectMock,
        insert: insertMock,
      }));

      const fallbackUser = { id: 'u1', email: 'fallback@test.com', role: 'student', first_name: 'Fall', last_name: 'Back' };
      const response = await AuthService.getUserProfile('u1', fallbackUser);

      expect(response).toHaveProperty('success', true);
      expect((response as any).data.email).toBe('fallback@test.com');
      expect(insertMock).toHaveBeenCalled();
    });
  });
});
