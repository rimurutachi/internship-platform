'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserProvider } from '@/components/providers/UserProvider';
import { SidebarProvider } from '@/components/providers/SidebarContext';
import { MobileHeaderProvider } from '@/components/providers/MobileHeaderContext';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="advisor">
      <UserProvider>
        <SidebarProvider>
          <MobileHeaderProvider
            defaultTitle="Advisor Portal"
            defaultSubtitle="Student Management"
          >
            <DashboardShell
              sidebar={<AdvisorSidebar />}
              header={<AdvisorHeader />}
              bottomNavType="advisor"
            >
              {children}
            </DashboardShell>
          </MobileHeaderProvider>
        </SidebarProvider>
      </UserProvider>
    </ProtectedRoute>
  );
}
