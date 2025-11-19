'use client';

import { Building2 } from 'lucide-react';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { SupervisorAnalytics } from '@/components/analytics/SupervisorAnalytics';

/**
 * SupervisorDashboard Component
 * 
 * Supervisor portal dashboard with analytics and performance insights.
 * Includes desktop and mobile views.
 */
const SupervisorDashboard = () => {

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <SupervisorSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <SupervisorHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Comprehensive insights and performance metrics</p>
              </div>

              {/* Analytics Content */}
              <SupervisorAnalytics />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header - Fixed */}
        <div className="flex-shrink-0">
          <MobileHeader 
            title="Dashboard"
            subtitle="Performance insights"
            logo={
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Comprehensive insights and performance metrics</p>
            </div>

            {/* Analytics Content */}
            <SupervisorAnalytics />
          </div>
        </div>

        {/* Bottom Navigation - Fixed */}
        <div className="flex-shrink-0">
          <BottomNavigation type="supervisor" />
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;