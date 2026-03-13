'use client';


import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { SupervisorAnalytics } from '@/components/analytics/SupervisorAnalytics';
import { useUserContext } from '@/components/providers/UserProvider';

/**
 * SupervisorDashboard Component
 * 
 * Supervisor portal dashboard with analytics and performance insights.
 * Includes desktop and mobile views.
 */
const SupervisorDashboard = () => {
  const { user } = useUserContext();
  
  const getInitials = () => {
    if (!user?.first_name || !user?.last_name) return 'SU';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const initials = getInitials();

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
                <h1 className="text-3xl font-bold text-foreground">Evaluation Dashboard</h1>
                <p className="text-muted-foreground mt-1">Submit and manage intern evaluations</p>
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
            title="Evaluations"
            subtitle="Manage intern evaluations"
            logo={
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
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
              <h1 className="text-2xl font-bold text-foreground">Evaluation Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Submit and manage intern evaluations</p>
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