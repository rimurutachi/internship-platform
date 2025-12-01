'use client';

import { useState, useEffect } from 'react';
import { UserProvider, useUserContext } from '@/components/providers/UserProvider';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { CurrentInternshipCard } from '@/components/student/CurrentInternshipCard';
import { EvaluationsCard } from '@/components/student/EvaluationsCard';
import { SkillsAssessmentCard } from '@/components/student/SkillsAssessmentCard';
import { QuickActionsCard } from '@/components/student/QuickActionsCard';
import { AIInsightsCard, RecentMessagesCard, UpcomingDeadlinesCard } from '@/components/student/AIInsightsCard';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { QuickActionGrid } from '@/components/mobile/QuickActionGrid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, MessageSquare, BarChart3, FileText, AlertCircle, Loader2 } from 'lucide-react';
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
  
  const quickActions = [
    { icon: ClipboardList, label: 'Tasks', color: 'bg-primary' },
    { icon: MessageSquare, label: 'Chat', color: 'bg-blue-500' },
    { icon: BarChart3, label: 'Progress', color: 'bg-purple-500' },
    { icon: FileText, label: 'Docs', color: 'bg-indigo-500' },
  ];

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
      <div className="h-screen bg-background overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:flex h-full">
          {/* Left Sidebar */}
          <StudentSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <StudentHeader />
          
          {/* Dashboard Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
                <div className="grid lg:grid-cols-4 gap-6">
                  {/* Main Content Area */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Current Internship Card */}
                    <CurrentInternshipCard 
                      internship={dashboardData.internship}
                      progress={dashboardData.progress}
                    />
                    
                    {/* Two Column Layout for Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <EvaluationsCard evaluations={dashboardData.recent_evaluations} />
                      <SkillsAssessmentCard />
                    </div>
                    
                    {/* Quick Actions */}
                    <QuickActionsCard />
                  </div>
                  
                  {/* Right Sidebar */}
                  <div className="space-y-6">
                    <AIInsightsCard insights={dashboardData.ai_insights || null} />
                    <RecentMessagesCard />
                    <UpcomingDeadlinesCard tasks={dashboardData.upcoming_tasks} />
                  </div>
                </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader 
          title="Intern-Galing"
        />

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="p-4 flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={user?.profile_data?.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-white font-bold text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Welcome, {user?.first_name || 'Student'}!
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user?.profile_data?.education || 'Computer Science'} \u2022 MIT
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Internship Status - Mobile Optimized */}
          <CurrentInternshipCard 
            internship={dashboardData.internship}
            progress={dashboardData.progress}
          />

          {/* Quick Actions Grid - Mobile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <QuickActionGrid actions={quickActions} />
            </CardContent>
          </Card>

          {/* Latest Evaluation - Mobile */}
          <EvaluationsCard evaluations={dashboardData.recent_evaluations} />

          {/* AI Insights - Mobile */}
          <AIInsightsCard insights={dashboardData.ai_insights || null} />
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation type="student" />
      </div>
    </div>
  );
};

export default StudentDashboard;