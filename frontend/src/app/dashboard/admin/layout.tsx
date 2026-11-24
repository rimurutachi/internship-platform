'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserProvider } from '@/components/providers/UserProvider';
import { NotificationsProvider } from '@/components/providers/NotificationsProvider';
import { SidebarProvider } from '@/components/providers/SidebarContext';
import { MobileHeaderProvider } from '@/components/providers/MobileHeaderContext';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <UserProvider>
        <NotificationsProvider>
          <SidebarProvider>
            <MobileHeaderProvider
              defaultTitle="Admin Portal"
              defaultSubtitle="Management Dashboard"
            >
              <DashboardShell
                sidebar={<AdminSidebar />}
                header={<AdminHeader />}
                bottomNavType="admin"
              >
                {children}
              </DashboardShell>
            </MobileHeaderProvider>
          </SidebarProvider>
        </NotificationsProvider>
      </UserProvider>
    </ProtectedRoute>
  );
}
