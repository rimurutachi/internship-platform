'use client';

import { ReactNode } from 'react';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useMobileHeader } from '@/components/providers/MobileHeaderContext';

interface DashboardShellProps {
  /** The role-specific sidebar component (rendered on desktop) */
  sidebar: ReactNode;
  /** The role-specific header component (rendered on desktop) */
  header: ReactNode;
  /** Bottom navigation type for mobile */
  bottomNavType: 'admin' | 'student' | 'advisor' | 'supervisor';
  /** Page content */
  children: ReactNode;
}

/**
 * DashboardShell Component
 * 
 * Persistent layout shell that renders the sidebar, header, mobile header,
 * and bottom navigation ONCE in the layout. Only the `children` (page content)
 * changes during navigation, preventing the shell from unmounting/remounting.
 * 
 * Desktop: Sidebar | Header + Content
 * Mobile: MobileHeader + Content + BottomNavigation
 */
export function DashboardShell({ sidebar, header, bottomNavType, children }: DashboardShellProps) {
  const { title, subtitle, logo } = useMobileHeader();

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar — persistent */}
        {sidebar}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header — persistent */}
          {header}
          
          {/* Page Content — this is what changes per route */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted">
            <div className="page-transition">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header — persistent */}
        <div className="flex-shrink-0">
          <MobileHeader 
            title={title}
            subtitle={subtitle}
            logo={logo}
          />
        </div>

        {/* Mobile Content — this is what changes per route */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 bg-muted">
          <div className="page-transition">
            {children}
          </div>
        </div>

        {/* Bottom Navigation — persistent */}
        <div className="flex-shrink-0">
          <BottomNavigation type={bottomNavType} />
        </div>
      </div>
    </div>
  );
}
