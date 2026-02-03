'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  User,
  Loader2,
  AlertCircle,
  Filter,
  MessageSquare
} from 'lucide-react';
import { SupervisorSidebar } from '@/components/supervisor/SupervisorSidebar';
import { SupervisorHeader } from '@/components/supervisor/SupervisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase';

interface WeeklyReport {
  id: string;
  student_id: string;
  internship_id: string;
  week_number: number;
  week_start_date?: string;
  week_end_date?: string;
  accomplishments: string;
  hours_rendered: number;
  challenges?: string;
  learnings?: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  rejection_reason?: string;
  supervisor_comments?: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  student_name?: string;
  student_email?: string;
  internship_position?: string;
}

interface ReportStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  total_hours: number;
}

const computeWeekDates = (startDate?: string, weekNumber?: number) => {
  if (!startDate || !weekNumber) {
    return { week_start_date: '', week_end_date: '' };
  }

  const start = new Date(startDate);
  const weekStart = new Date(start);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    week_start_date: weekStart.toISOString(),
    week_end_date: weekEnd.toISOString(),
  };
};

const extractSections = (text: string) => {
  const match = text.match(/^(.*?)(?:\n\nChallenges:\s*([\s\S]*?))?(?:\n\nLearnings:\s*([\s\S]*?))?$/i);

  return {
    accomplishments: match?.[1]?.trim() || text.trim(),
    challenges: match?.[2]?.trim() || '',
    learnings: match?.[3]?.trim() || '',
  };
};

export default function StudentReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data state
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<WeeklyReport[]>([]);
  const [statistics, setStatistics] = useState<ReportStatistics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    total_hours: 0,
  });
  
  // Filter state
  const [activeTab, setActiveTab] = useState<'pending_approval' | 'approved' | 'rejected'>('pending_approval');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  
  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  
  // Form state
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, activeTab, studentFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

      const response = await fetch(`${apiBase}/supervisor/weekly-reports`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔵 [Supervisor Reports] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Supervisor Reports] API error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to fetch reports');
      }

      const result = await response.json();

      console.log('🔍 [Supervisor Reports] Raw API data:', JSON.stringify(result.data, null, 2));

      const formattedReports: WeeklyReport[] = (result.data || []).map((report: any) => {
        const parsed = extractSections(report.accomplishments || '');
        const dates = computeWeekDates(report.internship?.start_date, report.week_number);
        const student = report.student || report.users; // fallback if backend changes shape

        console.log('🔍 [Supervisor Reports] Report status:', report.status, 'ID:', report.id);

        return {
          id: report.id,
          student_id: report.student_id,
          internship_id: report.internship_id,
          week_number: report.week_number,
          week_start_date: report.week_start_date || dates.week_start_date,
          week_end_date: report.week_end_date || dates.week_end_date,
          accomplishments: parsed.accomplishments,
          hours_rendered: report.hours_rendered,
          challenges: parsed.challenges,
          learnings: parsed.learnings,
          status: report.status,
          rejection_reason: report.status === 'rejected' ? (report.supervisor_comments || report.rejection_reason) : undefined,
          supervisor_comments: report.supervisor_comments,
          submitted_at: report.submitted_at || report.created_at,
          approved_at: report.approved_at,
          rejected_at: report.rejected_at,
          student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student' : 'Unknown Student',
          student_email: student?.email,
          internship_position: report.internship?.position,
        };
      });

      setReports(formattedReports);

      console.log('🔍 [Supervisor Reports] Total reports:', formattedReports.length);
      console.log('🔍 [Supervisor Reports] Report statuses:', formattedReports.map(r => ({ id: r.id.slice(0, 8), status: r.status })));

      const stats: ReportStatistics = {
        total: formattedReports.length,
        pending: formattedReports.filter(r => r.status === 'pending_approval').length,
        approved: formattedReports.filter(r => r.status === 'approved').length,
        rejected: formattedReports.filter(r => r.status === 'rejected').length,
        total_hours: formattedReports.reduce((sum, r) => sum + (r.hours_rendered || 0), 0),
      };

      console.log('🔍 [Supervisor Reports] Statistics:', stats);

      setStatistics(stats);

      const uniqueStudents = Array.from(
        new Map(
          formattedReports.map(r => [r.student_id, { id: r.student_id, name: r.student_name || 'Unknown' }])
        ).values()
      );
      setStudents(uniqueStudents);
    } catch (error: any) {
      console.error('❌ [Supervisor Reports] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    console.log('🔍 [Supervisor Reports] Filtering - Active tab:', activeTab, 'Student filter:', studentFilter);
    console.log('🔍 [Supervisor Reports] Total reports to filter:', reports.length);
    
    let filtered = reports.filter(r => r.status === activeTab);
    
    console.log('🔍 [Supervisor Reports] After status filter:', filtered.length, 'reports');
    
    if (studentFilter !== 'all') {
      filtered = filtered.filter(r => r.student_id === studentFilter);
      console.log('🔍 [Supervisor Reports] After student filter:', filtered.length, 'reports');
    }
    
    console.log('🔍 [Supervisor Reports] Final filtered reports:', filtered.map(r => ({ id: r.id.slice(0, 8), status: r.status, student: r.student_name })));
    
    setFilteredReports(filtered);
  };

  const openApproveDialog = (report: WeeklyReport) => {
    setSelectedReport(report);
    setApprovalComments('');
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (report: WeeklyReport) => {
    setSelectedReport(report);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const openViewDialog = (report: WeeklyReport) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleApproveReport = async () => {
    if (!selectedReport) return;

    try {
      setSubmitting(true);
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

      const response = await fetch(`${apiBase}/supervisor/weekly-reports/${selectedReport.id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comments: approvalComments || null }),
      });

      console.log('🔵 [Supervisor Reports] Approve response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Supervisor Reports] Approve failed:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to approve report');
      }

      toast({
        title: 'Report Approved',
        description: `Week ${selectedReport.week_number} report has been approved`,
      });

      setApproveDialogOpen(false);
      setSelectedReport(null);
      fetchData();
    } catch (error: any) {
      console.error('❌ [Supervisor Reports] Approve error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve report',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectReport = async () => {
    if (!selectedReport) return;

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Rejection reason must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

      const response = await fetch(`${apiBase}/supervisor/weekly-reports/${selectedReport.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() }),
      });

      console.log('🔵 [Supervisor Reports] Reject response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Supervisor Reports] Reject failed:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to reject report');
      }

      toast({
        title: 'Report Rejected',
        description: `Week ${selectedReport.week_number} report has been rejected`,
      });

      setRejectDialogOpen(false);
      setSelectedReport(null);
      fetchData();
    } catch (error: any) {
      console.error('❌ [Supervisor Reports] Reject error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject report',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400';
      case 'rejected': return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400';
      case 'pending_approval': return 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending_approval': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <SupervisorSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <SupervisorHeader />
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Student Reports</h1>
                  <p className="text-muted-foreground mt-1">Review and approve weekly accomplishment reports</p>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Refresh
                </Button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground">{statistics.total}</div>
                    <div className="text-sm text-muted-foreground">Total Reports</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statistics.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.approved}</div>
                    <div className="text-sm text-muted-foreground">Approved</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.rejected}</div>
                    <div className="text-sm text-muted-foreground">Rejected</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground">{statistics.total_hours}</div>
                    <div className="text-sm text-muted-foreground">Total Hours</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filter by Student:</span>
                    </div>
                    <Select value={studentFilter} onValueChange={setStudentFilter}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="All Students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Reports</CardTitle>
                  <CardDescription>Review student weekly accomplishments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pending_approval">
                        Pending ({statistics.pending})
                      </TabsTrigger>
                      <TabsTrigger value="approved">
                        Approved ({statistics.approved})
                      </TabsTrigger>
                      <TabsTrigger value="rejected">
                        Rejected ({statistics.rejected})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                      {filteredReports.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">
                            No {activeTab.replace('_', ' ')} reports
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredReports.map((report) => (
                            <Card key={report.id} className="hover:shadow-card transition-shadow">
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-semibold text-foreground">
                                          {report.student_name}
                                        </span>
                                      </div>
                                      <Badge className={getStatusColor(report.status)}>
                                        <div className="flex items-center gap-1">
                                          {getStatusIcon(report.status)}
                                          Week {report.week_number}
                                        </div>
                                      </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(report.week_start_date)} - {formatDate(report.week_end_date)}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {report.hours_rendered} hours
                                      </div>
                                      {report.internship_position && (
                                        <div className="text-xs bg-muted px-2 py-1 rounded">
                                          {report.internship_position}
                                        </div>
                                      )}
                                    </div>

                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                      <strong>Accomplishments:</strong> {report.accomplishments}
                                    </p>

                                    {report.challenges && (
                                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                        <strong>Challenges:</strong> {report.challenges}
                                      </p>
                                    )}

                                    {report.supervisor_comments && (
                                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                          <MessageSquare className="w-4 h-4 inline mr-1" />
                                          <strong>Your Comments:</strong> {report.supervisor_comments}
                                        </p>
                                      </div>
                                    )}

                                    {report.rejection_reason && (
                                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                          <strong>Rejection Reason:</strong> {report.rejection_reason}
                                        </p>
                                      </div>
                                    )}

                                    <div className="text-xs text-muted-foreground mt-3">
                                      Submitted: {formatDateTime(report.submitted_at)}
                                    </div>
                                  </div>

                                  <div className="flex gap-2 ml-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openViewDialog(report)}
                                    >
                                      View Details
                                    </Button>
                                    
                                    {report.status === 'pending_approval' && (
                                      <>
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() => openApproveDialog(report)}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => openRejectDialog(report)}
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Student Reports"
          subtitle="Review & Approve"
        />

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Mobile Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{statistics.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{statistics.approved}</div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-xl font-bold text-foreground">{statistics.total_hours}</div>
                  <div className="text-xs text-muted-foreground">Hours</div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Filter */}
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile Tabs */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="text-xs">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs">
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">
                  Rejected
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredReports.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">No reports</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredReports.map((report) => (
                      <Card key={report.id}>
                        <CardContent className="pt-4 pb-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold text-sm">{report.student_name}</div>
                                <div className="text-xs text-muted-foreground">Week {report.week_number}</div>
                              </div>
                              <Badge className={getStatusColor(report.status)} style={{ fontSize: '0.65rem' }}>
                                {report.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              {formatDate(report.week_start_date)} • {report.hours_rendered}h
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {report.accomplishments}
                            </p>

                            {report.rejection_reason && (
                              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                                <p className="text-xs text-red-600 dark:text-red-400">
                                  {report.rejection_reason}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => openViewDialog(report)}
                              >
                                View
                              </Button>
                              
                              {report.status === 'pending_approval' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                                    onClick={() => openApproveDialog(report)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1 text-xs"
                                    onClick={() => openRejectDialog(report)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <BottomNavigation type="supervisor" />
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Report</DialogTitle>
            <DialogDescription>
              Approve Week {selectedReport?.week_number} report for {selectedReport?.student_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Comments (Optional)</Label>
              <Textarea
                placeholder="Add any feedback or comments..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApproveReport}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Approve Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
            <DialogDescription>
              Reject Week {selectedReport?.week_number} report for {selectedReport?.student_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Explain why this report is being rejected (minimum 10 characters)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {rejectionReason.length} / 10 characters minimum
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectReport}
              disabled={submitting || rejectionReason.length < 10}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Week {selectedReport?.week_number} Report
              {selectedReport && (
                <Badge className={`ml-2 ${getStatusColor(selectedReport.status)}`}>
                  {selectedReport.status.replace('_', ' ')}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.student_name} • {selectedReport?.internship_position}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Period</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(selectedReport.week_start_date)} - {formatDate(selectedReport.week_end_date)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Hours Rendered</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedReport.hours_rendered} hours
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Accomplishments</Label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {selectedReport.accomplishments}
                </p>
              </div>

              {selectedReport.challenges && (
                <div>
                  <Label className="text-sm font-semibold">Challenges</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {selectedReport.challenges}
                  </p>
                </div>
              )}

              {selectedReport.learnings && (
                <div>
                  <Label className="text-sm font-semibold">Learnings</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {selectedReport.learnings}
                  </p>
                </div>
              )}

              {selectedReport.supervisor_comments && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <Label className="text-sm font-semibold text-blue-600 dark:text-blue-400">Your Comments</Label>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {selectedReport.supervisor_comments}
                  </p>
                </div>
              )}

              {selectedReport.rejection_reason && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                  <Label className="text-sm font-semibold text-red-600 dark:text-red-400">Rejection Reason</Label>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {selectedReport.rejection_reason}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Submitted: {formatDateTime(selectedReport.submitted_at)}
                {selectedReport.approved_at && (
                  <> • Approved: {formatDateTime(selectedReport.approved_at)}</>
                )}
                {selectedReport.rejected_at && (
                  <> • Rejected: {formatDateTime(selectedReport.rejected_at)}</>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedReport?.status === 'pending_approval' && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setTimeout(() => openRejectDialog(selectedReport), 100);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setTimeout(() => openApproveDialog(selectedReport), 100);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
            {selectedReport?.status !== 'pending_approval' && (
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
