import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserProvider } from '@/components/providers/UserProvider';
import { SidebarProvider } from '@/components/providers/SidebarContext';

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="advisor">
      <UserProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </UserProvider>
    </ProtectedRoute>
  );
}
