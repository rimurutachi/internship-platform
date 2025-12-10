'use client';

import { Shield } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { AdminAnalyticsOJT } from '@/components/analytics/AdminAnalyticsOJT';
import { useUserContext } from '@/components/providers/UserProvider';

/**
 * AdminDashboard Component
 * 
 * Admin portal dashboard with comprehensive analytics and system insights.
 * Includes desktop and mobile views.
 */
const AdminDashboard = () => {
  const { user } = useUserContext();
  
  const getInitials = () => {
    if (!user?.first_name || !user?.last_name) return 'AD';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const initials = getInitials();

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <AdminHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">OJT Dashboard</h1>
                <p className="text-muted-foreground mt-1">Internship platform overview and analytics</p>
              </div>

              {/* OJT Analytics Content */}
              <AdminAnalyticsOJT />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header - Fixed */}
        <div className="flex-shrink-0">
          <MobileHeader 
            title="Admin Portal"
            subtitle="System Dashboard"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
            }
          />
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">OJT Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Internship platform overview</p>
            </div>

            {/* OJT Analytics Content */}
            <AdminAnalyticsOJT />
          </div>
        </div>

        {/* Bottom Navigation - Fixed */}
        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
