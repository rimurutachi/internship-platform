import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserProvider } from '@/components/providers/UserProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <UserProvider>
        {children}
      </UserProvider>
    </ProtectedRoute>
  );
}
