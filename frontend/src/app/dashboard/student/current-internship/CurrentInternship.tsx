'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Building2, Clock, CheckCircle2, AlertCircle, Loader2, TrendingUp, Target } from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { hoursApi } from '@/lib/api/hours';
import type { InternshipHoursSummary, DailyHoursBreakdown } from '@/types/hours';
import { createSupabaseClient } from '@/lib/supabase';

interface DailyReport {
  id: string;
  report_date: string;
  hours_worked: number;
}

interface InternshipData {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  supervisor: { name: string; email: string } | null;
  advisor: { name: string; email: string } | null;
  progress: number;
  status: string;
  department?: string;
}

interface Milestone {
  id: number;
  title: string;
  date: string;
  completed: boolean;
}

export default function CurrentInternship() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internship, setInternship] = useState<InternshipData | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  
  // Hours tracking state
  const [hoursSummary, setHoursSummary] = useState<InternshipHoursSummary | null>(null);
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyHoursBreakdown[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [approvedDTRCount, setApprovedDTRCount] = useState<number>(0);

  useEffect(() => {
    loadInternshipData();
  }, []);

  const fetchHoursData = async (internshipId: string) => {
    try {
      const supabase = createSupabaseClient();
      
      console.log('🔵 [Hours Data] Fetching for internship:', internshipId);
      
      const [summaryResult, breakdownResult, reportsResult] = await Promise.all([
        hoursApi.getInternshipHoursSummary(internshipId),
        hoursApi.getDailyHoursBreakdown(internshipId),
        supabase
          .from('student_daily_reports')
          .select('id, report_date, hours_worked, internship_id, created_at')
          .eq('internship_id', internshipId)
          .order('report_date', { ascending: true }),
        supabase
          .from('weekly_dtr_submissions')
          .select('id')
          .eq('internship_id', internshipId)
          .eq('status', 'approved')
      ]);
      
      console.log('🔵 [Daily Reports] Query result:', {
        data: reportsResult.data,
        error: reportsResult.error,
        count: reportsResult.data?.length || 0
      });
      
      console.log('🔵 [Daily Breakdown] Hours API result:', {
        data: breakdownResult.data,
        count: breakdownResult.data?.length || 0
      });
      
      if (summaryResult.success && summaryResult.data) {
        setHoursSummary(summaryResult.data);
      }
      if (breakdownResult.success && breakdownResult.data) {
        setDailyBreakdown(breakdownResult.data);
      }
      if (reportsResult.data) {
        console.log('✅ [Daily Reports] Setting daily reports:', reportsResult.data);
        setDailyReports(reportsResult.data);
      }
      if (reportsResult.error) {
        console.error('❌ [Daily Reports] Supabase error:', reportsResult.error);
      }

      // Check the 4th element (index 3) for the DTR result
      const dtrResult = arguments[0]?.[3] ?? await supabase.from('weekly_dtr_submissions').select('id').eq('internship_id', internshipId).eq('status', 'approved');
      if (dtrResult?.data) {
        setApprovedDTRCount(dtrResult.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch hours data:', error);
    }
  };

  const loadInternshipData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createSupabaseClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      console.log('🔵 [Current Internship] Loading for user:', user.id);

      // Use backend API for consistency with dashboard
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      const response = await fetch(`${apiBase}/student/internship`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔵 [Current Internship] API response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('⚠️ [Current Internship] No active internship found for user:', user.id);
          setError('No active internship found');
          setLoading(false);
          return;
        }
        const errorData = await response.json();
        console.error('❌ [Current Internship] API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch internship');
      }

      const result = await response.json();
      const internshipData = result.data?.internship;

      if (!internshipData) {
        console.warn('⚠️ [Current Internship] No internship data in response');
        setError('No active internship found');
        setLoading(false);
        return;
      }

      console.log('✅ [Current Internship] Data loaded:', {
        id: internshipData.id,
        position: internshipData.position,
        progress: internshipData.progress_percentage,
      });

      // Use progress from backend (already calculated)
      const progress = internshipData.progress_percentage || 0;

      const formattedInternship: InternshipData = {
        id: internshipData.id,
        position: internshipData.position,
        company: internshipData.company?.name || 'Unknown Company',
        location: internshipData.company?.address || 'Location not specified',
        startDate: internshipData.start_date,
        endDate: internshipData.end_date,
        supervisor: internshipData.supervisor ? {
          name: internshipData.supervisor.name || `${internshipData.supervisor.first_name} ${internshipData.supervisor.last_name}`,
          email: internshipData.supervisor.email
        } : null,
        advisor: internshipData.advisor ? {
          name: internshipData.advisor.name || `${internshipData.advisor.first_name} ${internshipData.advisor.last_name}`,
          email: internshipData.advisor.email
        } : null,
        progress,
        status: internshipData.status,
        department: internshipData.department || undefined
      };

      setInternship(formattedInternship);

      // Fetch hours data
      await fetchHoursData(internshipData.id);

      // Define today for milestone checks
      const today = new Date();

      // Create milestones based on internship dates and evaluations
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('evaluation_type, created_at, status')
        .eq('internship_id', internshipData.id)
        .order('created_at', { ascending: true });

      const dynamicMilestones: Milestone[] = [
        {
          id: 1,
          title: 'Internship Start',
          date: internshipData.start_date,
          completed: new Date(internshipData.start_date) <= today
        }
      ];

      if (evaluations) {
        evaluations.forEach((evaluation, index) => {
          dynamicMilestones.push({
            id: index + 2,
            title: `${evaluation.evaluation_type.charAt(0).toUpperCase() + evaluation.evaluation_type.slice(1)} Evaluation`,
            date: evaluation.created_at.split('T')[0],
            completed: evaluation.status === 'approved' || evaluation.status === 'processed'
          });
        });
      }

      dynamicMilestones.push({
        id: dynamicMilestones.length + 1,
        title: 'Internship Completion',
        date: internshipData.end_date,
        completed: new Date(internshipData.end_date) <= today
      });

      setMilestones(dynamicMilestones);

    } catch (err: any) {
      console.error('Error loading internship:', err);
      setError(err.message || 'Failed to load internship data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-background overflow-hidden">
        <div className="hidden lg:flex h-full">
          <StudentSidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <StudentHeader />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-[#4CAF50] mx-auto" />
                <p className="text-gray-600 text-lg">Loading internship details...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:hidden h-screen flex flex-col overflow-hidden">
          <MobileHeader title="Current Internship" subtitle="Loading..." />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#4CAF50]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="h-screen bg-background overflow-hidden">
        <div className="hidden lg:flex h-full">
          <StudentSidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <StudentHeader />
            <div className="flex-1 flex items-center justify-center p-8">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base">
                  {error || 'No active internship found'}
                  <div className="mt-4">
                    <Button onClick={() => router.push('/dashboard/student')} variant="outline">
                      Back to Dashboard
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
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
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-muted">
            <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Current Internship</h1>
        <p className="text-muted-foreground mt-2 text-lg">Track your internship progress and milestones</p>
      </div>

      {/* Internship Overview Card */}
      <Card className="bg-card border border-border">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-primary text-white text-base px-3 py-1">Active</Badge>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-6">{internship.position}</h2>
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <span className="text-lg">{internship.company}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span className="text-lg">{internship.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span className="text-lg">Started {new Date(internship.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours Progress Card - Full Version */}
      {hoursSummary && (
        <Card className="bg-card border border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Hours Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg text-muted-foreground">
                  {hoursSummary.total_hours_worked} / {hoursSummary.required_hours} hours completed
                </span>
                <span className="text-2xl font-bold text-primary">
                  {hoursSummary.progress_percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={hoursSummary.progress_percentage} 
                className="h-4" 
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm">Hours Worked</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{hoursSummary.total_hours_worked}</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-5 w-5" />
                  <span className="text-sm">Remaining</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{hoursSummary.remaining_hours}</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Weeks Reported</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{approvedDTRCount}</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Projected End</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {hoursSummary.projected_end_date 
                    ? new Date(hoursSummary.projected_end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'TBD'
                  }
                </p>
              </div>
            </div>

            {/* Completion Status */}
            {hoursSummary.is_completed && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400">
                <p className="font-medium text-lg">✅ Congratulations! You've completed your required internship hours!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Daily Hours Log */}
      {dailyBreakdown.length > 0 && (
        <Card className="bg-card border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Daily Hours Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyBreakdown.map((day) => {
                return (
                  <div 
                    key={day.report_date}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {new Date(day.report_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xl font-semibold">{day.hours_worked}h</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        <Card className="bg-card border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-foreground">Company Supervisor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground text-lg">{internship.supervisor?.name || 'Not assigned'}</div>
                <div className="text-base text-muted-foreground">{internship.supervisor?.email || 'No email'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-foreground">University Advisor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-semibold text-foreground text-lg">{internship.advisor?.name || 'Not assigned'}</div>
                <div className="text-base text-muted-foreground">{internship.advisor?.email || 'No email'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex gap-4 pb-8">
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                  milestone.completed ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {milestone.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                  )}
                </div>
                <Card className="flex-1 bg-card border border-border">
                  <CardContent className="p-6">
                    <div className="font-semibold text-foreground text-lg">{milestone.title}</div>
                    <div className="text-base text-muted-foreground mt-1">{new Date(milestone.date).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
      </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Current Internship"
          subtitle="Track your progress and milestones"
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Internship Overview */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-success/10 text-success">Active</Badge>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{internship.position}</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{internship.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{internship.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Started {new Date(internship.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hours Progress Card - Mobile */}
          {hoursSummary && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Hours Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {hoursSummary.total_hours_worked} / {hoursSummary.required_hours}h
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {hoursSummary.progress_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={hoursSummary.progress_percentage} className="h-3" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="h-3 w-3" />
                      <span>Worked</span>
                    </div>
                    <p className="text-xl font-bold">{hoursSummary.total_hours_worked}h</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Target className="h-3 w-3" />
                      <span>Remaining</span>
                    </div>
                    <p className="text-xl font-bold">{hoursSummary.remaining_hours}h</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Calendar className="h-3 w-3" />
                      <span>Weeks</span>
                    </div>
                    <p className="text-xl font-bold">{approvedDTRCount}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Calendar className="h-3 w-3" />
                      <span>End Date</span>
                    </div>
                    <p className="text-sm font-bold">
                      {hoursSummary.projected_end_date 
                        ? new Date(hoursSummary.projected_end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'TBD'
                      }
                    </p>
                  </div>
                </div>

                {/* Completion Status */}
                {hoursSummary.is_completed && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400">
                    <p className="font-medium text-sm">✅ Hours requirement completed!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Daily Breakdown - Mobile */}
          {dailyBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daily Hours Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dailyBreakdown.slice(0, 5).map((day) => {
                    return (
                      <div 
                        key={day.report_date}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {new Date(day.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Badge>
                        </div>
                        <span className="font-semibold">{day.hours_worked}h</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Info */}
          <div className="grid grid-cols-1 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Supervisor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{internship.supervisor?.name || 'Not assigned'}</div>
                    <div className="text-xs text-muted-foreground">{internship.supervisor?.email || 'No email'}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3 text-xs" size="sm">Send Message</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Advisor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-ai/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-ai" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{internship.advisor?.name || 'Not assigned'}</div>
                    <div className="text-xs text-muted-foreground">{internship.advisor?.email || 'No email'}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3 text-xs" size="sm">Send Message</Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <BottomNavigation type="student" />
      </div>
    </div>
  );
}

