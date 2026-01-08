'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Save,
  Send,
  Edit2,
  Eye
} from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase';

interface WeeklyReport {
  id: string;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  accomplishments: string;
  hours_rendered: number;
  challenges?: string;
  learnings?: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  rejection_reason?: string;
  supervisor_comments?: string;
  submitted_at: string;
  approved_at?: string;
  supervisor_id?: string;
}

interface Internship {
  id: string;
  position: string;
  company_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

const computeWeekDates = (startDate: string, weekNumber: number) => {
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

export default function WeeklyReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data state
  const [internship, setInternship] = useState<Internship | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    week_number: 0,
    accomplishments: '',
    hours_rendered: 0,
    challenges: '',
    learnings: '',
  });

  // Auto-save draft timer
  useEffect(() => {
    if (!createDialogOpen) return;
    
    const timer = setTimeout(() => {
      if (formData.accomplishments || formData.challenges || formData.learnings) {
        saveDraft();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [formData, createDialogOpen]);

  // Fetch user and internship data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      console.log('🔵 [Weekly Reports] Fetching data for user:', user.id);

      // Build API base
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

      // Use backend to fetch student's active internship (avoids RLS issues)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      const internshipsRes = await fetch(
        `${apiBase}/internships?student_id=${encodeURIComponent(user.id)}&status=active`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!internshipsRes.ok) {
        const err = await internshipsRes.json().catch(() => ({}));
        console.error('❌ [Weekly Reports] Backend internships fetch failed:', err);
        throw new Error(err.error || 'Failed to fetch internships');
      }

      const internshipsJson = await internshipsRes.json();
      const internshipsList = Array.isArray(internshipsJson?.data) ? internshipsJson.data : [];

      // Find the first non-archived active internship (company joined by backend)
      const active = internshipsList.find((i: any) => i?.status === 'active' && i?.is_archived !== true);

      if (active) {
        const internshipInfo = {
          id: active.id,
          position: active.position,
          company_name: active.company?.name || 'Unknown Company',
          start_date: active.start_date,
          end_date: active.end_date,
          status: active.status,
        };
        setInternship(internshipInfo);

        console.log('✅ [Weekly Reports] Internship found:', internshipInfo.id);

        // Fetch weekly reports from backend API
        const response = await fetch(`${apiBase}/student/weekly-reports?internship_id=${active.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('🔵 [Weekly Reports] API response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ [Weekly Reports] API error:', errorData);
          throw new Error(errorData.message || 'Failed to fetch reports');
        }

        const result = await response.json();
        console.log('✅ [Weekly Reports] Fetched reports:', result.data?.length || 0);

        const normalizedReports = (result.data || []).map((report: any) => {
          const parsed = extractSections(report.accomplishments || '');
          const dates = computeWeekDates(internshipInfo.start_date, report.week_number);

          return {
            ...report,
            accomplishments: parsed.accomplishments,
            challenges: parsed.challenges,
            learnings: parsed.learnings,
            week_start_date: report.week_start_date || dates.week_start_date,
            week_end_date: report.week_end_date || dates.week_end_date,
          };
        });

        setReports(normalizedReports);
      } else {
        console.warn('⚠️ [Weekly Reports] No active internship found for user:', user.id);
        setInternship(null);
        setReports([]);
      }
    } catch (error: any) {
      console.error('❌ [Weekly Reports] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage as draft with timestamp
      const draft = {
        ...formData,
        savedAt: new Date().toISOString(),
        internshipId: internship?.id,
      };
      
      localStorage.setItem('weeklyReportDraft', JSON.stringify(draft));
      
      console.log('✅ [Weekly Reports] Draft saved:', {
        weekNumber: formData.week_number,
        savedAt: draft.savedAt
      });
      
      toast({
        title: 'Draft Saved',
        description: 'Your progress has been saved locally',
      });
    } catch (error: any) {
      console.error('❌ [Weekly Reports] Failed to save draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('weeklyReportDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        
        // Check if draft is for the current internship
        if (parsed.internshipId === internship?.id) {
          setFormData({
            week_number: parsed.week_number || getNextWeekNumber(),
            accomplishments: parsed.accomplishments || '',
            hours_rendered: parsed.hours_rendered || 0,
            challenges: parsed.challenges || '',
            learnings: parsed.learnings || '',
          });
          
          const savedAt = new Date(parsed.savedAt).toLocaleString();
          console.log('✅ [Weekly Reports] Draft loaded from:', savedAt);
          
          toast({
            title: 'Draft Loaded',
            description: `Previous draft from ${savedAt} has been restored`,
          });
        } else {
          console.log('⚠️ [Weekly Reports] Draft ignored: Different internship');
        }
      }
    } catch (error) {
      console.error('❌ [Weekly Reports] Failed to load draft:', error);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('weeklyReportDraft');
  };

  const getNextWeekNumber = (): number => {
    if (reports.length === 0) return 1;
    const maxWeek = Math.max(...reports.map(r => r.week_number));
    return maxWeek + 1;
  };

  const getTotalWeeks = (): number => {
    if (!internship) return 0;
    const start = new Date(internship.start_date);
    const end = new Date(internship.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000));
    return diffWeeks;
  };

  const openCreateDialog = () => {
    const nextWeek = getNextWeekNumber();
    setFormData({
      week_number: nextWeek,
      accomplishments: '',
      hours_rendered: 0,
      challenges: '',
      learnings: '',
    });
    loadDraft();
    setCreateDialogOpen(true);
  };

  const handleCreateReport = async () => {
    if (!internship) return;

    console.log('🔵 [Weekly Reports] Validating form data...');

    // Validation
    if (!formData.accomplishments || formData.accomplishments.trim().length < 50) {
      console.error('❌ [Weekly Reports] Validation failed: Accomplishments too short');
      toast({
        title: 'Validation Error',
        description: 'Accomplishments must be at least 50 characters',
        variant: 'destructive',
      });
      return;
    }

    if (formData.hours_rendered < 0 || formData.hours_rendered > 168) {
      console.error('❌ [Weekly Reports] Validation failed: Invalid hours');
      toast({
        title: 'Validation Error',
        description: 'Hours rendered must be between 0 and 168',
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

      const payload = {
        internship_id: internship.id,
        week_number: formData.week_number,
        accomplishments: formData.accomplishments.trim(),
        hours_rendered: formData.hours_rendered,
        challenges: formData.challenges?.trim() || null,
        learnings: formData.learnings?.trim() || null,
      };

      console.log('🔵 [Weekly Reports] Submitting report:', {
        weekNumber: payload.week_number,
        accomplishmentsLength: payload.accomplishments.length,
        hours: payload.hours_rendered
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Handle both cases: with and without /api in the base URL
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      const response = await fetch(`${apiBase}/student/weekly-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('🔵 [Weekly Reports] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Weekly Reports] Submission failed:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to submit report');
      }

      const result = await response.json();
      console.log('✅ [Weekly Reports] Report submitted successfully:', result);

      toast({
        title: 'Report Submitted',
        description: `Week ${formData.week_number} report submitted successfully`,
      });

      clearDraft();
      setCreateDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('❌ [Weekly Reports] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit report',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReport = async (reportId: string) => {
    if (!selectedReport) return;

    console.log('🔵 [Weekly Reports] Validating update...');

    // Validation
    if (!formData.accomplishments || formData.accomplishments.trim().length < 50) {
      console.error('❌ [Weekly Reports] Validation failed: Accomplishments too short');
      toast({
        title: 'Validation Error',
        description: 'Accomplishments must be at least 50 characters',
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

      const payload = {
        accomplishments: formData.accomplishments.trim(),
        hours_rendered: formData.hours_rendered,
        challenges: formData.challenges?.trim() || null,
        learnings: formData.learnings?.trim() || null,
      };

      console.log('🔵 [Weekly Reports] Updating report:', {
        reportId,
        accomplishmentsLength: payload.accomplishments.length,
        hours: payload.hours_rendered
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      const response = await fetch(`${apiBase}/student/weekly-reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('🔵 [Weekly Reports] Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Weekly Reports] Update failed:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to update report');
      }

      const result = await response.json();
      console.log('✅ [Weekly Reports] Report updated successfully:', result);

      toast({
        title: 'Report Updated',
        description: 'Your report has been updated and resubmitted',
      });

      setViewDialogOpen(false);
      setSelectedReport(null);
      fetchData();
    } catch (error: any) {
      console.error('❌ [Weekly Reports] Update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update report',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openViewDialog = (report: WeeklyReport) => {
    setSelectedReport(report);
    setFormData({
      week_number: report.week_number,
      accomplishments: report.accomplishments,
      hours_rendered: report.hours_rendered,
      challenges: report.challenges || '',
      learnings: report.learnings || '',
    });
    setViewDialogOpen(true);
  };

  const canEditReport = (report: WeeklyReport): boolean => {
    return report.status === 'pending_approval' || report.status === 'rejected';
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Active Internship</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You need an active internship to submit weekly reports.
            </p>
            <Button onClick={() => router.push('/dashboard/student')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <StudentHeader />
          
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
            <div className="space-y-8">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Weekly Reports</h1>
                  <p className="text-gray-600 mt-2 text-lg">
                    {internship.position} at {internship.company_name}
                  </p>
                </div>
                <Button 
                  className="bg-[#4CAF50] hover:bg-[#45a049] text-white text-base px-6 py-6"
                  onClick={openCreateDialog}
                  disabled={getNextWeekNumber() > getTotalWeeks()}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Report
                </Button>
              </div>

              {/* Progress Section */}
              <div className="grid grid-cols-1 gap-8">
                {/* Internship Progress */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <CardTitle className="text-2xl text-gray-900">Internship Progress</CardTitle>
                    <CardDescription className="text-base text-gray-600">Track your weekly report submissions</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-base text-gray-600">Progress</div>
                        <div className="text-3xl font-bold text-gray-900 mt-1">
                          {reports.length} / {getTotalWeeks()}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">weeks completed</div>
                      </div>
                      <div>
                        <div className="text-base text-gray-600">Approved</div>
                        <div className="text-3xl font-bold text-[#4CAF50] mt-1">
                          {reports.filter(r => r.status === 'approved').length}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">reports</div>
                      </div>
                      <div>
                        <div className="text-base text-gray-600">Pending</div>
                        <div className="text-3xl font-bold text-yellow-600 mt-1">
                          {reports.filter(r => r.status === 'pending_approval').length}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">reports</div>
                      </div>
                      <div>
                        <div className="text-base text-gray-600">Total Hours</div>
                        <div className="text-3xl font-bold text-gray-900 mt-1">
                          {reports.reduce((sum, r) => sum + r.hours_rendered, 0)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">hours logged</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reports List */}
              <Card className="bg-white border border-gray-200">
                <CardHeader className="border-b border-gray-200 pb-6">
                  <CardTitle className="text-2xl text-gray-900">Submitted Reports</CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    View and edit your weekly accomplishment reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {reports.length === 0 ? (
                    <div className="text-center py-16">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                      <p className="text-gray-600 text-lg mb-6">No reports submitted yet</p>
                      <Button 
                        className="bg-[#4CAF50] hover:bg-[#45a049] text-white"
                        variant="outline"
                        onClick={openCreateDialog}
                      >
                        Submit Your First Report
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <Card key={report.id} className="hover:shadow-md transition-shadow border border-gray-200">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h3 className="font-semibold text-gray-900 text-xl">
                                    Week {report.week_number}
                                  </h3>
                                  <Badge className={getStatusColor(report.status) + " text-base px-3 py-1"}>
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(report.status)}
                                      {report.status.replace('_', ' ')}
                                    </div>
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-base text-gray-600 mb-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    {formatDate(report.week_start_date)} - {formatDate(report.week_end_date)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    {report.hours_rendered} hours
                                  </div>
                                </div>
                                <p className="text-base text-gray-600 line-clamp-2">
                                  {report.accomplishments}
                                </p>
                                {report.status === 'rejected' && report.rejection_reason && (
                                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-base text-red-700">
                                      <strong>Rejection Reason:</strong> {report.rejection_reason}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewDialog(report)}
                                className="border-gray-300 text-base px-4 py-5"
                              >
                                {canEditReport(report) ? (
                                  <><Edit2 className="w-4 h-4 mr-2" /> Edit</>
                                ) : (
                                  <><Eye className="w-4 h-4 mr-2" /> View</>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Weekly Reports"
          subtitle={`${internship.position}`}
        />

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Mobile Progress Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="text-xl font-bold text-foreground">
                    {reports.length}/{getTotalWeeks()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xs text-muted-foreground">Total Hours</div>
                  <div className="text-xl font-bold text-foreground">
                    {reports.reduce((sum, r) => sum + r.hours_rendered, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile New Report Button */}
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={openCreateDialog}
              disabled={getNextWeekNumber() > getTotalWeeks()}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>

            {/* Mobile Reports List */}
            {reports.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No reports yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">Week {report.week_number}</h3>
                        <Badge className={getStatusColor(report.status)} style={{ fontSize: '0.7rem' }}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {formatDate(report.week_start_date)} • {report.hours_rendered}h
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {report.accomplishments}
                      </p>
                      {report.status === 'rejected' && report.rejection_reason && (
                        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {report.rejection_reason}
                          </p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => openViewDialog(report)}
                      >
                        {canEditReport(report) ? 'Edit Report' : 'View Report'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <BottomNavigation type="student" />
      </div>

      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Weekly Report - Week {formData.week_number}</DialogTitle>
            <DialogDescription>
              Document your accomplishments, hours, challenges, and learnings for this week
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Accomplishments <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Describe what you accomplished this week (minimum 50 characters)..."
                value={formData.accomplishments}
                onChange={(e) => setFormData({ ...formData, accomplishments: e.target.value })}
                rows={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.accomplishments.length} / 50 characters minimum
              </p>
            </div>

            <div>
              <Label>Hours Rendered <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="0"
                max="168"
                value={formData.hours_rendered}
                onChange={(e) => setFormData({ ...formData, hours_rendered: parseInt(e.target.value) || 0 })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total hours worked this week (0-168)
              </p>
            </div>

            <div>
              <Label>Challenges (Optional)</Label>
              <Textarea
                placeholder="Describe any challenges you faced..."
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Learnings (Optional)</Label>
              <Textarea
                placeholder="What did you learn this week..."
                value={formData.learnings}
                onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Draft
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateReport}
                disabled={submitting || formData.accomplishments.length < 50}
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Report
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Report Dialog */}
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
              {selectedReport && canEditReport(selectedReport) 
                ? 'You can edit and resubmit this report' 
                : 'View report details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Accomplishments</Label>
              <Textarea
                value={formData.accomplishments}
                onChange={(e) => setFormData({ ...formData, accomplishments: e.target.value })}
                rows={5}
                className="mt-2"
                disabled={!selectedReport || !canEditReport(selectedReport)}
              />
            </div>

            <div>
              <Label>Hours Rendered</Label>
              <Input
                type="number"
                value={formData.hours_rendered}
                onChange={(e) => setFormData({ ...formData, hours_rendered: parseInt(e.target.value) || 0 })}
                className="mt-2"
                disabled={!selectedReport || !canEditReport(selectedReport)}
              />
            </div>

            <div>
              <Label>Challenges</Label>
              <Textarea
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                rows={3}
                className="mt-2"
                disabled={!selectedReport || !canEditReport(selectedReport)}
              />
            </div>

            <div>
              <Label>Learnings</Label>
              <Textarea
                value={formData.learnings}
                onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                rows={3}
                className="mt-2"
                disabled={!selectedReport || !canEditReport(selectedReport)}
              />
            </div>

            {selectedReport?.status === 'approved' && selectedReport.supervisor_comments && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                  Supervisor's Comments
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
                  {selectedReport.supervisor_comments}
                </p>
              </div>
            )}

            {selectedReport?.status === 'rejected' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
                  Rejection Reason:
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">
                  {selectedReport.supervisor_comments || selectedReport.rejection_reason}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {selectedReport && canEditReport(selectedReport) ? (
              <Button
                onClick={() => handleUpdateReport(selectedReport.id)}
                disabled={submitting || formData.accomplishments.length < 50}
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Update & Resubmit
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
