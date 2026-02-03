import { ReactNode } from 'react';
import { UserProvider } from '@/components/providers/UserProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface SupervisorLayoutProps {
  children: ReactNode;
}

/**
 * Layout for supervisor dashboard pages
 * Wraps all supervisor pages with authentication and user context
 */
export default function SupervisorLayout({ children }: SupervisorLayoutProps) {
  return (
    <ProtectedRoute requiredRole="supervisor">
      <UserProvider>
        {children}
      </UserProvider>
    </ProtectedRoute>
  );
}
