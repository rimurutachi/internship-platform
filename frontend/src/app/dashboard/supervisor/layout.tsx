import { ReactNode } from 'react';
import { UserProvider } from '@/components/providers/UserProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SidebarProvider } from '@/components/providers/SidebarContext';

interface SupervisorLayoutProps {
  children: ReactNode;
}

/**
 * Layout for supervisor dashboard pages
 * Wraps all supervisor pages with authentication, user context, and sidebar state
 */
export default function SupervisorLayout({ children }: SupervisorLayoutProps) {
  return (
    <ProtectedRoute requiredRole="supervisor">
      <UserProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </UserProvider>
    </ProtectedRoute>
  );
}
