'use client';

import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { AdvisorAnalytics } from '@/components/analytics/AdvisorAnalytics';

export default function Analytics() {
  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <AdvisorSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <AdvisorHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground mt-1">Comprehensive insights and performance metrics</p>
              </div>

              {/* Analytics Content */}
              <AdvisorAnalytics />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Analytics"
          subtitle="Performance insights"
          notificationCount={15}
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Comprehensive insights and performance metrics</p>
            </div>

            {/* Analytics Content */}
            <AdvisorAnalytics />
          </div>
        </div>
        <BottomNavigation type="advisor" />
      </div>
    </div>
  );
}

