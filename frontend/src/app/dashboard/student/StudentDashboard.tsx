'use client';

import { useState, useEffect } from 'react';
import { UserProvider, useUserContext } from '@/components/providers/UserProvider';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { CurrentInternshipCard } from '@/components/student/CurrentInternshipCard';
import { WeeklyLogsCard } from '@/components/student/WeeklyLogsCard';
import { QuickActionsNewCard } from '@/components/student/QuickActionsNewCard';
import { ProgressAnalyticsCard } from '@/components/student/ProgressAnalyticsCard';
import { DocumentTrackerCard } from '@/components/student/DocumentTrackerCard';
import { ActivityFeedCard } from '@/components/student/ActivityFeedCard';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { studentAPI } from '@/lib/api/student';
import type { DashboardData } from '@/types/student';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * StudentDashboard Component
 * 
 * Main dashboard view for students with desktop and mobile layouts.
 * Includes tabs for dashboard and analytics views.
 */
const StudentDashboard = () => {
  const { user } = useUserContext();
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load dashboard data on mount
  useEffect(() => {
    loadDashboard();
  }, []);
  
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔵 Loading dashboard...');
      const response = await studentAPI.getDashboard();
      console.log('🟢 Dashboard API response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Dashboard data loaded:', response.data);
        setDashboardData(response.data);
      } else {
        console.error('❌ Dashboard API error:', response.error);
        setError(response.error || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('💥 Dashboard load exception:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.charAt(0) || '';
    const lastInitial = user.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-screen bg-background overflow-hidden">
        <div className="hidden lg:flex h-full">
          <StudentSidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <StudentHeader />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Loading dashboard...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:hidden flex flex-col h-full">
          <MobileHeader title="Intern-Galing" />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <div className="h-screen bg-background overflow-hidden">
        <div className="hidden lg:flex h-full">
          <StudentSidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <StudentHeader />
            <div className="flex-1 flex items-center justify-center p-6">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>
                  {error || 'Failed to load dashboard data. Please try refreshing the page.'}
                  <button 
                    onClick={loadDashboard}
                    className="mt-2 text-sm underline hover:no-underline"
                  >
                    Retry
                  </button>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
        <div className="lg:hidden flex flex-col h-full">
          <MobileHeader title="Intern-Galing" />
          <div className="flex-1 flex items-center justify-center p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="h-screen bg-[#f5f5f5] overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:flex h-full">
          {/* Left Sidebar */}
          <StudentSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <StudentHeader />
          
          {/* Dashboard Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
            <div className="max-w-[1800px] mx-auto">
            {/* Welcome Banner */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="text-base text-gray-600">
                {user?.profile_data?.education || 'CvSU Student'}
              </p>
            </div>

            {/* Dashboard Grid Layout - Matching Figma */}
            <div className="grid xl:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="xl:col-span-2 space-y-8">
                {/* Current Internship - Full Width */}
                <CurrentInternshipCard 
                  internship={dashboardData.internship}
                  progress={dashboardData.progress}
                />
                
                {/* Weekly Logs and Quick Actions - Side by Side */}
                <div className="grid md:grid-cols-2 gap-8">
                  <WeeklyLogsCard logsCount={4} />
                  <QuickActionsNewCard />
                </div>
                
                {/* Progress & Analytics and Document Tracker - Side by Side */}
                <div className="grid md:grid-cols-2 gap-8">
                  <ProgressAnalyticsCard />
                  <DocumentTrackerCard />
                </div>
              </div>
              
              {/* Right Column - Activity Feed */}
              <div className="space-y-8">
                <ActivityFeedCard />
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden bg-[#f5f5f5]">
        {/* Mobile Header */}
        <MobileHeader 
          title="Intern-Galing"
        />

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Welcome Card */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4 flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-[#4CAF50]">
                <AvatarImage src={user?.profile_data?.avatar_url} />
                <AvatarFallback className="bg-[#4CAF50] text-white font-bold text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Welcome, {user?.first_name}!
                </h2>
                <p className="text-sm text-gray-600">
                  {user?.profile_data?.education || 'CvSU Student'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Internship Status - Mobile Optimized */}
          <CurrentInternshipCard 
            internship={dashboardData.internship}
            progress={dashboardData.progress}
          />

          {/* Weekly Logs - Mobile */}
          <WeeklyLogsCard logsCount={4} />

          {/* Quick Actions - Mobile */}
          <QuickActionsNewCard />

          {/* Document Tracker - Mobile */}
          <DocumentTrackerCard />

          {/* Activity Feed - Mobile */}
          <ActivityFeedCard />
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation type="student" />
      </div>
    </div>
  );
};

export default StudentDashboard;