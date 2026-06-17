'use client';

import { AdminAnalyticsOJT } from '@/components/analytics/AdminAnalyticsOJT';
import { useUserContext } from '@/components/providers/UserProvider';

/**
 * AdminDashboard Component
 * 
 * Admin portal dashboard with comprehensive analytics and system insights.
 * Includes desktop and mobile views.
 */
const AdminDashboard = () => {
  useUserContext();

  return (
    <div className="space-y-6">
            <div className="space-y-6">
              {/* OJT Analytics Content */}
              <AdminAnalyticsOJT />
            </div>
    </div>
  );
};

export default AdminDashboard;
