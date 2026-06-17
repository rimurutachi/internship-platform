'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useUserContext } from '@/components/providers/UserProvider';
import { CurrentInternshipCard } from '@/components/student/CurrentInternshipCard';
import { WeeklyLogsCard } from '@/components/student/WeeklyLogsCard';
import { QuickActionsNewCard } from '@/components/student/QuickActionsNewCard';
import { FinalEvaluationCard } from '@/components/student/FinalEvaluationCard';
import { TasksCard } from '@/components/student/TasksCard';

import { AlertCircle, Loader2 } from 'lucide-react';
import { studentAPI } from '@/lib/api/student';
import type { DashboardData } from '@/types/student';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * StudentDashboard Component
 * 
 * Main dashboard view for students.
 * Shell (sidebar, header, bottom nav) is handled by the layout's DashboardShell.
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

        // Load daily logs count
        try {
          const r = await fetch('/api/student/daily-reports/count', { credentials: 'include' });
          if (r.ok) {
            const d = await r.json();
            setLogsCount(d.count ?? 0);
          } else {
            console.warn('⚠️ Daily logs count request failed', r.status);
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-base text-muted-foreground">
          {user?.profile_data?.education || 'CvSU Student'}
        </p>
      </div>

      {/* Dashboard Content Layout */}
      <div className="space-y-8">
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
    </div>
  );
};

export default StudentDashboard;