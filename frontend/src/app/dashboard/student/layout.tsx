import { ReactNode } from 'react';
import { UserProvider } from '@/components/providers/UserProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface StudentLayoutProps {
  children: ReactNode;
}

/**
 * Layout for student dashboard pages
 * Wraps all student pages with authentication and user context
 */
export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <ProtectedRoute requiredRole="student">
      <UserProvider>
        {children}
      </UserProvider>
    </ProtectedRoute>
  );
}
