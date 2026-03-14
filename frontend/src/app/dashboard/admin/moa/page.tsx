'use client';

import MOAManagement from '@/components/admin/MOAManagement';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';

export default function MOAPage() {
  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdminHeader />
          <div className="flex-1 overflow-y-auto p-6">
            <MOAManagement />
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden flex flex-col h-full">
        <MobileHeader title="MOA Management" />
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <MOAManagement />
        </div>
        <BottomNavigation type="admin" />
      </div>
    </div>
  );
}
