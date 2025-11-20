'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@/hooks/use-user';
import type { User } from '@/types';

interface UserContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

/**
 * UserProvider Component
 * 
 * Provides user profile data to the entire application
 */
export function UserProvider({ children }: UserProviderProps) {
  const userData = useUser();

  return (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Custom hook to access user context
 * 
 * @throws Error if used outside UserProvider
 */
export function useUserContext(): UserContextValue {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  
  return context;
}
