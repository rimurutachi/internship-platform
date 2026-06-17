'use client';

import { SupervisorAnalytics } from '@/components/analytics/SupervisorAnalytics';
import { useUserContext } from '@/components/providers/UserProvider';

/**
 * SupervisorDashboard Component
 * 
 * Supervisor portal dashboard with analytics and performance insights.
 * Includes desktop and mobile views.
 */
const SupervisorDashboard = () => {
  useUserContext();
  


  return (
    <div className="space-y-6">
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
  );
};

export default SupervisorDashboard;