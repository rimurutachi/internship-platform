import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserProvider } from '@/components/providers/UserProvider';

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="supervisor">
      <UserProvider>
        {children}
      </UserProvider>
    </ProtectedRoute>
  );
}
