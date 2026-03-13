'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useUserContext } from '@/components/providers/UserProvider';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { CurrentInternshipCard } from '@/components/student/CurrentInternshipCard';
import { WeeklyLogsCard } from '@/components/student/WeeklyLogsCard';
import { QuickActionsNewCard } from '@/components/student/QuickActionsNewCard';
import { FinalEvaluationCard } from '@/components/student/FinalEvaluationCard';
import { TasksCard } from '@/components/student/TasksCard';
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
  const [logsCount, setLogsCount] = useState<number>(0);
  const [finalAvailable, setFinalAvailable] = useState<{ available: boolean; reason?: string }>({ available: false });
  
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

        // Fetch daily report logs count for current internship
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
          const supabase = (await import('@/lib/supabase')).createSupabaseClient();
          const { data: { session } } = await supabase.auth.getSession();
          const internshipId = response.data.internship?.id;
          if (session?.access_token && internshipId) {
            console.log('🔵 Fetching daily logs count...', { internshipId });
            const r = await fetch(`${apiBase}/student/daily-reports?internship_id=${internshipId}`, {
              headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            });
            if (r.ok) {
              const j = await r.json();
              const count = Array.isArray(j.data) ? j.data.length : 0;
              console.log('🟢 Daily logs count:', count);
              setLogsCount(count);
            } else {
              console.warn('⚠️ Daily logs count request failed', r.status);
            }
          }
        } catch (e) {
          console.warn('⚠️ Daily logs count fetch error:', e);
        }

        // Determine final evaluation availability
        try {
          const evalsResp = await studentAPI.getEvaluations(5, 0);
          const internshipEnd = response.data.internship?.end_date;
          const hasFinalApproved = evalsResp.success && evalsResp.data?.evaluations?.some((e: any) => (e.evaluation_type || 'final') === 'final');
          const internshipEnded = internshipEnd ? new Date() >= new Date(internshipEnd) : false;
          const available = Boolean(hasFinalApproved && internshipEnded);
          const reason = available ? undefined : (!hasFinalApproved ? 'No approved final evaluation yet' : 'Final evaluation will unlock after internship end');
          console.log('ℹ️ Final evaluation availability:', { available, internshipEnd, hasFinalApproved, internshipEnded });
          setFinalAvailable({ available, reason });
        } catch (e) {
          console.warn('⚠️ Final evaluation availability check failed:', e);
        }
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
      <div className="h-screen bg-muted overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:flex h-full">
          {/* Left Sidebar */}
          <StudentSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <StudentHeader />
          
          {/* Dashboard Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-muted">
            <div className="max-w-[1800px] mx-auto">
            {/* Welcome Banner */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="text-base text-muted-foreground">
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
                  <WeeklyLogsCard logsCount={logsCount} />
                  <QuickActionsNewCard />
                </div>
                
                {/* Final Evaluation and Tasks - Side by Side */}
                <div className="grid md:grid-cols-2 gap-8">
                  <FinalEvaluationCard 
                    isAvailable={finalAvailable.available}
                    releaseDate={dashboardData.internship?.end_date}
                    disabledReason={finalAvailable.reason}
                  />
                  <TasksCard internshipId={dashboardData.internship?.id} />
                </div>
              </div>
              
              {/* Right Column - Intentionally left empty for now */}
              <div className="space-y-8" />
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden bg-muted">
        {/* Mobile Header */}
        <MobileHeader 
          title="Intern-Galing"
        />

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Welcome Card */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={user?.profile_data?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Welcome, {user?.first_name}!
                </h2>
                <p className="text-sm text-muted-foreground">
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
          <WeeklyLogsCard logsCount={logsCount} />

          {/* Quick Actions - Mobile */}
          <QuickActionsNewCard />

          {/* Final Evaluation & Tasks - Mobile */}
          <FinalEvaluationCard 
            isAvailable={finalAvailable.available}
            releaseDate={dashboardData.internship?.end_date}
            disabledReason={finalAvailable.reason}
          />
          <TasksCard internshipId={dashboardData.internship?.id} />
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation type="student" />
      </div>
    </div>
  );
};

export default StudentDashboard;