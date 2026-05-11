'use client';
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { adminInternshipsAPI } from '@/lib/api/admin-internships';
import { hoursApi } from '@/lib/api/hours';
import type {
  InternshipWithRelations,
  ActivityLogEntry,
} from '@/lib/api/admin-internships';
import type { InternshipHoursSummary } from '@/types/hours';
import { createSupabaseClient } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, User, Building2, Briefcase, TrendingUp, Clock, Target, FileText, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

// DTR submission type
interface WeeklyDTREntry {
  id: string;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  status: 'pending' | 'approved' | 'revision_requested';
  extracted_hours: number;
  manual_hours_override: number | null;
  ai_scan_status: string;
  ai_scan_result: Record<string, any>;
  submitted_at: string;
  reviewed_at: string | null;
  file_name: string;
}

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
  
  // Weekly DTR submission history
  const [dtrHistory, setDtrHistory] = useState<WeeklyDTREntry[]>([]);

  useEffect(() => {
    if (open && internshipId) {
      fetchInternshipDetails();
      fetchHoursData();
      fetchDTRHistory();
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
      const summaryResult = await hoursApi.getInternshipHoursSummary(internshipId);
      
      if (summaryResult.success && summaryResult.data) {
        setHoursSummary(summaryResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch hours data:', error);
    }
  };

  const fetchDTRHistory = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('weekly_dtr_submissions')
        .select('id, week_number, week_start_date, week_end_date, status, extracted_hours, manual_hours_override, ai_scan_status, ai_scan_result, submitted_at, reviewed_at, file_name')
        .eq('internship_id', internshipId)
        .order('week_number', { ascending: true });

      if (error) {
        console.error('Failed to fetch DTR history:', error);
        return;
      }
      setDtrHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch DTR history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  const getDTRStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'revision_requested':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Revision
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  /**
   * Get the display date range for a DTR entry.
   * Priority: AI scan daily_breakdown dates > week_start_date/week_end_date
   */
  const getDTRDateRange = (dtr: WeeklyDTREntry): { start: string; end: string } => {
    // Try AI scan result first
    if (dtr.ai_scan_result?.daily_breakdown && Array.isArray(dtr.ai_scan_result.daily_breakdown) && dtr.ai_scan_result.daily_breakdown.length > 0) {
      const dates = dtr.ai_scan_result.daily_breakdown
        .map((d: any) => d.date)
        .filter((d: string) => d);
      if (dates.length > 0) {
        return {
          start: dates[0],
          end: dates[dates.length - 1],
        };
      }
    }
    // Fallback to submission dates
    return {
      start: dtr.week_start_date,
      end: dtr.week_end_date,
    };
  };

  const getDTRHours = (dtr: WeeklyDTREntry): number => {
    return dtr.manual_hours_override ?? dtr.extracted_hours ?? 0;
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
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
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">Total Weeks</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {hoursSummary.weeks_reported ?? dtrHistory.filter(d => d.status === 'approved').length}
                      </p>
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
                  <p className="text-sm">Hours will appear once weekly DTR submissions are approved</p>
                </div>
              )}

              <Separator />

              {/* Weekly DTR Submission History */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Weekly DTR Submission History</h3>
                </div>
                {dtrHistory.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground border rounded-lg bg-muted/30">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No weekly DTR submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {dtrHistory.map((dtr) => {
                      const dateRange = getDTRDateRange(dtr);
                      const hours = getDTRHours(dtr);
                      const isManual = dtr.manual_hours_override !== null;

                      return (
                        <div 
                          key={dtr.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge variant="outline" className="shrink-0 font-semibold">
                              Week {dtr.week_number}
                            </Badge>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">
                                {formatShortDate(dateRange.start)} – {formatShortDate(dateRange.end)}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {dtr.file_name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="font-semibold text-sm">{hours}h</span>
                              </div>
                              {isManual && (
                                <span className="text-xs text-amber-500">Manual</span>
                              )}
                              {dtr.ai_scan_status === 'failed' && !isManual && (
                                <span className="text-xs text-red-500">Scan failed</span>
                              )}
                            </div>
                            {getDTRStatusBadge(dtr.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
