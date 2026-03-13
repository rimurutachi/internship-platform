'use client';
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { adminInternshipsAPI } from '@/lib/api/admin-internships';
import { hoursApi } from '@/lib/api/hours';
import type {
  InternshipWithRelations,
  ActivityLogEntry,
} from '@/lib/api/admin-internships';
import type { InternshipHoursSummary, DailyHoursBreakdown } from '@/types/hours';
import { createSupabaseClient } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DailyReport {
  id: string;
  report_date: string;
  hours_worked: number;
}
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, User, Building2, Briefcase, TrendingUp, Clock, Target } from 'lucide-react';
import RemindersManagement from './RemindersManagement';

interface ViewInternshipModalProps {
  open: boolean;
  onClose: () => void;
  internshipId: string;
}

export function ViewInternshipModal({
  open,
  onClose,
  internshipId,
}: ViewInternshipModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [internship, setInternship] = useState<InternshipWithRelations | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  
  // Hours tracking state
  const [hoursSummary, setHoursSummary] = useState<InternshipHoursSummary | null>(null);
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyHoursBreakdown[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    if (open && internshipId) {
      fetchInternshipDetails();
      fetchHoursData();
    }
  }, [open, internshipId]);

  const fetchInternshipDetails = async () => {
    try {
      setLoading(true);
      const response = await adminInternshipsAPI.getInternship(internshipId);
      setInternship(response.data.internship);
      setActivityLog(response.data.activity_log);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch internship details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHoursData = async () => {
    try {
      const supabase = createSupabaseClient();
      
      console.log('🔵 [Admin Hours Data] Fetching for internship:', internshipId);
      
      const [summaryResult, breakdownResult, reportsResult] = await Promise.all([
        hoursApi.getInternshipHoursSummary(internshipId),
        hoursApi.getDailyHoursBreakdown(internshipId),
        supabase
          .from('student_daily_reports')
          .select('id, report_date, hours_worked, internship_id, created_at')
          .eq('internship_id', internshipId)
          .order('report_date', { ascending: true })
      ]);
      
      console.log('🔵 [Admin Daily Reports] Query result:', {
        data: reportsResult.data,
        error: reportsResult.error,
        count: reportsResult.data?.length || 0
      });
      
      console.log('🔵 [Admin Daily Breakdown] Hours API result:', {
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
        console.log('✅ [Admin Daily Reports] Setting daily reports:', reportsResult.data);
        setDailyReports(reportsResult.data);
      }
      if (reportsResult.error) {
        console.error('❌ [Admin Daily Reports] Supabase error:', reportsResult.error);
      }
    } catch (error) {
      console.error('Failed to fetch hours data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'secondary',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Internship Details</DialogTitle>
          <DialogDescription>
            View complete information about this internship assignment
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : internship ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Overview Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Overview</h3>
                {getStatusBadge(internship.status)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{internship.position}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Required Hours</p>
                  <p className="font-medium">
                    {hoursSummary?.required_hours || 'N/A'} hours
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Student Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Student</h3>
              </div>
              <div className="ml-7 space-y-1">
                <p className="font-medium">{internship.student?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{internship.student?.email || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            {/* Company Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Company</h3>
              </div>
              <div className="ml-7 space-y-1">
                <p className="font-medium">{internship.company?.name || 'Unknown'}</p>
                {internship.company?.industry && (
                  <p className="text-sm text-muted-foreground">
                    Industry: {internship.company.industry}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Mentors Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Mentors</h3>
              </div>
              <div className="ml-7 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Advisor</p>
                  <p className="font-medium">{internship.advisor?.name || 'Not assigned'}</p>
                  <p className="text-sm text-muted-foreground">{internship.advisor?.email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Supervisor</p>
                  <p className="font-medium">{internship.supervisor?.name || 'Not assigned'}</p>
                  <p className="text-sm text-muted-foreground">
                    {internship.supervisor?.email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Timeline</h3>
              </div>
              <div className="ml-7 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(internship.start_date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Projected End Date</p>
                  <p className="font-medium">
                    {hoursSummary?.projected_end_date 
                      ? formatDate(hoursSummary.projected_end_date)
                      : 'TBD (based on hours progress)'
                    }
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Activity Log Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Activity Log</h3>
              {activityLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {activityLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{log.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{log.user?.name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                        {log.metadata?.changes && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p className="font-medium">Changes:</p>
                            <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata.changes, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6 pt-4">
              {/* Hours Progress Summary */}
              {hoursSummary ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Hours Progress</h3>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {hoursSummary.total_hours_worked} / {hoursSummary.required_hours} hours
                      </span>
                      <span className="font-semibold text-primary text-lg">
                        {hoursSummary.progress_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={hoursSummary.progress_percentage} 
                      className="h-3" 
                    />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Hours Worked</span>
                      </div>
                      <p className="text-2xl font-bold">{hoursSummary.total_hours_worked}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span className="text-sm">Remaining</span>
                      </div>
                      <p className="text-2xl font-bold">{hoursSummary.remaining_hours}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Days Reported</span>
                      </div>
                      <p className="text-2xl font-bold">{hoursSummary.days_reported}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Projected End</span>
                      </div>
                      <p className="text-lg font-bold">
                        {hoursSummary.projected_end_date 
                          ? new Date(hoursSummary.projected_end_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Completion Status */}
                  {hoursSummary.is_completed && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400">
                      <p className="font-medium">✅ Internship hours requirement completed!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hours data available yet</p>
                  <p className="text-sm">Hours will appear once daily reports are submitted</p>
                </div>
              )}

              <Separator />

              {/* Daily Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Daily Hours Log</h3>
                {dailyBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No daily reports submitted yet</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {dailyBreakdown.map((day) => {
                      return (
                        <div 
                          key={day.report_date}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">
                              {new Date(day.report_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{day.hours_worked}h</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reminders" className="mt-6">
              <RemindersManagement internshipId={internshipId} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Internship not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
