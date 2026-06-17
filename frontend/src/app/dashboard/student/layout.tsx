'use client';

import { ReactNode } from 'react';
import { UserProvider } from '@/components/providers/UserProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SidebarProvider } from '@/components/providers/SidebarContext';
import { MobileHeaderProvider } from '@/components/providers/MobileHeaderContext';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';

interface StudentLayoutProps {
  children: ReactNode;
}

/**
 * Layout for student dashboard pages
 * Wraps all student pages with authentication, user context, and persistent shell
 */
export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <ProtectedRoute requiredRole="student">
      <UserProvider>
        <SidebarProvider>
          <MobileHeaderProvider
            defaultTitle="Student Portal"
            defaultSubtitle="Internship Dashboard"
          >
            <DashboardShell
              sidebar={<StudentSidebar />}
              header={<StudentHeader />}
              bottomNavType="student"
            >
              {children}
            </DashboardShell>
          </MobileHeaderProvider>
        </SidebarProvider>
      </UserProvider>
    </ProtectedRoute>
  );
}
