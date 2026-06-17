'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserProvider } from '@/components/providers/UserProvider';
import { SidebarProvider } from '@/components/providers/SidebarContext';
import { MobileHeaderProvider } from '@/components/providers/MobileHeaderContext';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="supervisor">
      <UserProvider>
        <SidebarProvider>
          <MobileHeaderProvider
            defaultTitle="Supervisor Portal"
            defaultSubtitle="Intern Management"
          >
            <DashboardShell
              sidebar={<SupervisorSidebar />}
              header={<SupervisorHeader />}
              bottomNavType="supervisor"
            >
              {children}
            </DashboardShell>
          </MobileHeaderProvider>
        </SidebarProvider>
      </UserProvider>
    </ProtectedRoute>
  );
}
