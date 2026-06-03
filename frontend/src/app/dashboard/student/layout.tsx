import { ReactNode } from 'react';
import { UserProvider } from '@/components/providers/UserProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SidebarProvider } from '@/components/providers/SidebarContext';

interface StudentLayoutProps {
  children: ReactNode;
}

/**
 * Layout for student dashboard pages
 * Wraps all student pages with authentication, user context, and sidebar state
 */
export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <ProtectedRoute requiredRole="student">
      <UserProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </UserProvider>
    </ProtectedRoute>
  );
}
