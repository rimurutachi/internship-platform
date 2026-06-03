import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserProvider } from '@/components/providers/UserProvider';
import { SidebarProvider } from '@/components/providers/SidebarContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <UserProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </UserProvider>
    </ProtectedRoute>
  );
}
