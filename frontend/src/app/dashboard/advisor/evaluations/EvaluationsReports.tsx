'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Clock,
  Eye,
  Building2,
  Calendar,
  Search,
} from 'lucide-react';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createSupabaseClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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

interface WeeklyReport {
  id: string;
  studentName: string;
  weekNumber: number;
  accomplishments: string;
  hoursRendered: number;
  challenges?: string;
  learnings?: string;
  weekStartDate: string;
  weekEndDate: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  supervisorComment?: string;
  supervisorReviewedAt?: string;
}

interface Evaluation {
  id: string;
  internship_id: string;
  student_id: string;
  supervisor_id: string;
  studentName: string;
  studentEmail: string;
  supervisorName: string;
  company: string;
  position: string;
  evaluationType: 'final';
  rubric_id?: string | null;
  criterion_scores: Array<{
    criterion_code: string;
    criterion_name: string;
    score: number;
  }>;
  total_score: number | null;
  final_grade: number | null;
  attendance?: string | null;
  punctuality?: string | null;
  supervisorComment?: string | null;
  status: 'submitted' | 'revision_requested' | 'approved';
  submittedAt: string;
  approvedAt?: string;
}

export default function EvaluationsReports() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'weekly-reports' | 'evaluations'>('weekly-reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  useEffect(() => {
    fetchWeeklyReports();
    fetchEvaluations();
  }, []);

  const fetchWeeklyReports = async () => {
    try {
      console.log('📊 [Advisor Weekly Reports] Starting fetch...');
      setLoadingReports(true);
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('❌ [Advisor Weekly Reports] No session token available');
        throw new Error('No session token available');
      }
      console.log('✅ [Advisor Weekly Reports] Session token obtained');

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

      // Fetch advisor students to get internship context
      const studentsRes = await fetch(`${apiBase}/advisor/students`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!studentsRes.ok) {
        const err = await studentsRes.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Failed to fetch advisor students');
      }

      const studentsData = await studentsRes.json();
      console.log('📝 [Advisor Weekly Reports] Fetched', studentsData.data?.length || 0, 'advisor students');
      const internships: Array<{
        internshipId: string;
        studentName: string;
        studentEmail?: string;
        company?: string;
        position?: string;
        startDate?: string;
        endDate?: string;
      }> = (studentsData.data || []).map((item: any) => ({
        internshipId: item.internship?.id || item.internship?.internshipId || item.internship?.internship_id || item.id,
        studentName: item.name,
        studentEmail: item.email,
        company: item.internship?.company,
        position: item.internship?.position,
        startDate: item.internship?.startDate,
        endDate: item.internship?.endDate,
      })).filter((i: { internshipId: any; }) => Boolean(i.internshipId));

      const reportsByInternship: WeeklyReport[][] = await Promise.all(
        internships.map(async (intern) => {
          try {
            const res = await fetch(`${apiBase}/advisor/weekly-reports/internship/${intern.internshipId}`, {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.message || err.error || 'Failed to fetch weekly reports');
            }

            const result = await res.json();
            return (result.data || []).map((report: any) => {
              const parsed = extractSections(report.accomplishments || '');
              const dates = computeWeekDates(intern.startDate, report.week_number);

              const mapStatus = (status: string) => {
                if (status === 'pending_approval') return 'pending';
                return status as WeeklyReport['status'];
              };

              return {
                id: report.id,
                studentName: intern.studentName || report.student?.first_name || 'Unknown',
                weekNumber: report.week_number,
                accomplishments: parsed.accomplishments,
                hoursRendered: report.hours_rendered,
                challenges: parsed.challenges,
                learnings: parsed.learnings,
                weekStartDate: report.week_start_date || dates.week_start_date,
                weekEndDate: report.week_end_date || dates.week_end_date,
                status: mapStatus(report.status),
                submittedAt: report.created_at,
                supervisorComment: report.supervisor_comments,
                supervisorReviewedAt: report.approved_at || report.rejected_at,
              } satisfies WeeklyReport;
            });
          } catch (error) {
            console.error('❌ [Advisor Weekly Reports] Failed for internship:', intern.internshipId, error);
            return [];
          }
        })
      );

      const flattened: WeeklyReport[] = reportsByInternship.flat();
      console.log('✅ [Advisor Weekly Reports] Successfully fetched', flattened.length, 'total reports');
      setReports(flattened);
    } catch (error: any) {
      console.error('❌ [Advisor Weekly Reports] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load weekly reports',
        variant: 'destructive',
      });
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      console.log('📊 [Advisor Evaluations] Starting fetch...');
      setLoadingEvaluations(true);
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ [Advisor Evaluations] No user found');
        return;
      }
      console.log('✅ [Advisor Evaluations] User authenticated:', user.id);

      console.log('🔍 [Advisor Evaluations] Querying evaluations table with advisor_id:', user.id);
      const { data: evaluationsData, error } = await supabase
        .from('evaluations')
        .select(`
          id,
          internship_id,
          student_id,
          supervisor_id,
          advisor_id,
          evaluation_type,
          rubric_id,
          total_score,
          final_grade,
          attendance,
          punctuality,
          supervisor_comments,
          status,
          submitted_at,
          approved_at,
          internships:internships!evaluations_internship_id_fkey(
            id,
            position,
            student_id,
            supervisor_id,
            advisor_id,
            companies(name)
          ),
          users:users!evaluations_student_id_fkey(
            id,
            email,
            first_name,
            last_name
          ),
          supervisor:users!evaluations_supervisor_id_fkey(
            id,
            first_name,
            last_name
          ),
          evaluation_criterion_scores: evaluation_criterion_scores(criterion_code, criterion_name, score)
        `)
        .eq('evaluation_type', 'final')
        .eq('status', 'approved')
        .eq('advisor_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ [Advisor Evaluations] Supabase query error:', error);
        throw error;
      }
      console.log('✅ [Advisor Evaluations] Query successful, received', evaluationsData?.length || 0, 'evaluations');

      console.log('🔍 [Advisor Evaluations] Fetching advised students...');
      const { data: advisedStudents } = await supabase
        .from('internships')
        .select('student_id')
        .eq('advisor_id', user.id);

      const advisedStudentIds = (advisedStudents || []).map((s) => s.student_id);
      console.log('✅ [Advisor Evaluations] Found', advisedStudentIds.length, 'advised students');
      console.log('📋 [Advisor Evaluations] Advised student IDs:', advisedStudentIds);

      console.log('📊 [Advisor Evaluations] Raw evaluations from query:', evaluationsData?.length || 0);
      console.log('🔍 [Advisor Evaluations] Full query result:', JSON.stringify(evaluationsData, null, 2));
      
      if (evaluationsData && evaluationsData.length > 0) {
        console.log('📋 [Advisor Evaluations] First evaluation:', {
          id: evaluationsData[0].id,
          student_id: evaluationsData[0].student_id,
          status: evaluationsData[0].status,
          approved_at: evaluationsData[0].approved_at,
          final_grade: evaluationsData[0].final_grade,
        });
        console.log('📋 [Advisor Evaluations] All evaluation student_ids:', evaluationsData.map((e: any) => e.student_id));
        console.log('📋 [Advisor Evaluations] Status breakdown:', evaluationsData.reduce((acc: any, e: any) => {
          acc[e.status] = (acc[e.status] || 0) + 1;
          return acc;
        }, {}));
      } else {
        console.warn('⚠️ [Advisor Evaluations] No evaluations returned from query!');
        console.log('🔍 [Advisor Evaluations] Checking ALL evaluations (no status filter)...');
        const { data: allEvals } = await supabase
          .from('evaluations')
          .select('id, student_id, status, approved_at, final_grade')
          .eq('evaluation_type', 'final')
          .order('submitted_at', { ascending: false })
          .limit(10);
        console.log('📋 [Advisor Evaluations] ALL recent evaluations (first 10):', allEvals);
      }

      const formatted: Evaluation[] = (evaluationsData || [])
        .filter((evaluation: any) => {
          const matches = advisedStudentIds.includes(evaluation.student_id);
          if (!matches && evaluationsData && evaluationsData.length > 0) {
            console.warn('⚠️ [Advisor Evaluations] Student', evaluation.student_id, 'not in advised list');
          }
          return matches;
        })
        .filter((evaluation: any) => advisedStudentIds.includes(evaluation.student_id))
        .map((evaluation: any) => ({
          id: evaluation.id,
          internship_id: evaluation.internship_id,
          student_id: evaluation.student_id,
          supervisor_id: evaluation.supervisor_id,
          studentName: evaluation.users ? `${evaluation.users.first_name} ${evaluation.users.last_name}` : 'Unknown',
          studentEmail: evaluation.users?.email || 'Unknown',
          supervisorName: evaluation.supervisor ? `${evaluation.supervisor.first_name} ${evaluation.supervisor.last_name}` : 'Unknown',
          company: (evaluation.internships?.companies as any)?.name || 'Unknown',
          position: evaluation.internships?.position || 'Intern',
          evaluationType: 'final',
          rubric_id: evaluation.rubric_id,
          criterion_scores: evaluation.evaluation_criterion_scores || [],
          total_score: evaluation.total_score,
          final_grade: evaluation.final_grade,
          attendance: evaluation.attendance,
          punctuality: evaluation.punctuality,
          supervisorComment: evaluation.supervisor_comments,
          status: evaluation.status,
          submittedAt: evaluation.submitted_at,
          approvedAt: evaluation.approved_at,
        }));
      
      console.log('✅ [Advisor Evaluations] Formatted', formatted.length, 'evaluations for advisor students');

      setEvaluations(formatted);
      console.log('✅ [Advisor Evaluations] Successfully set', formatted.length, 'evaluations in state');
    } catch (error: any) {
      console.error('❌ [Advisor Evaluations] Error:', error);
      console.error('❌ [Advisor Evaluations] Error details:', JSON.stringify(error, null, 2));
      toast({
        title: 'Error',
        description: error.message || 'Failed to load evaluations',
        variant: 'destructive',
      });
      setEvaluations([]);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  const getMaxScore = (evaluation?: Evaluation | null) => {
    if (!evaluation) return 0;
    const count = evaluation.criterion_scores?.length || 0;
    return count > 0 ? count * 10 : 70;
  };

  const getPercentageScore = (evaluation?: Evaluation | null) => {
    if (!evaluation || evaluation.total_score === null || evaluation.total_score === undefined) return null;
    const maxScore = getMaxScore(evaluation);
    if (!maxScore) return null;
    return ((evaluation.total_score / maxScore) * 100).toFixed(1);
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, filterStatus]);

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => {
      const matchesSearch = evaluation.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evaluation.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || evaluation.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [evaluations, searchQuery, filterStatus]);

  const reportStats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  }), [reports]);

  const evaluationStats = {
    total: evaluations.length,
    pendingReview: evaluations.filter(e => e.status === 'submitted').length,
    approved: evaluations.filter(e => e.status === 'approved').length,
    revisionRequested: evaluations.filter(e => e.status === 'revision_requested').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20';
      case 'pending':
      case 'pending_review':
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
      case 'revision_requested':
        return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleViewReport = (report: WeeklyReport) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const handleViewEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsEvaluationModalOpen(true);
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <AdvisorSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <AdvisorHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-muted">
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Evaluations & Reports</h1>
                <p className="text-gray-600 mt-2 text-lg">Review student weekly reports and final evaluations</p>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
                <TabsList className="bg-card border border-border p-1">
                  <TabsTrigger value="weekly-reports" className="data-[state=active]:bg-[#4CAF50] data-[state=active]:text-white text-base px-6 py-3">
                    Weekly Reports
                  </TabsTrigger>
                  <TabsTrigger value="evaluations" className="data-[state=active]:bg-[#4CAF50] data-[state=active]:text-white text-base px-6 py-3">
                    Final Evaluations
                  </TabsTrigger>
                </TabsList>

                {/* Weekly Reports Tab */}
                <TabsContent value="weekly-reports" className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-card border border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">{reportStats.total}</div>
                        <div className="text-base text-muted-foreground mt-1">Total Reports</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-yellow-600">{reportStats.pending}</div>
                        <div className="text-base text-muted-foreground mt-1">Pending Review</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-primary">{reportStats.approved}</div>
                        <div className="text-base text-muted-foreground mt-1">Approved</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-red-600">{reportStats.rejected}</div>
                        <div className="text-base text-muted-foreground mt-1">Rejected</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Filters */}
                  <Card className="bg-card border border-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                          <Input
                            placeholder="Search by student name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 text-base"
                          />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full md:w-56 h-11 text-base">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reports List */}
                  <div className="space-y-4">
                    {loadingReports ? (
                      <Card className="bg-card border border-border">
                        <CardContent className="py-16 text-center">
                          <p className="text-muted-foreground text-lg">Loading reports...</p>
                        </CardContent>
                      </Card>
                    ) : filteredReports.length === 0 ? (
                      <Card className="bg-card border border-border">
                        <CardContent className="py-16 text-center">
                          <p className="text-muted-foreground text-lg">No reports found</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredReports.map((report) => (
                        <Card key={report.id} className="bg-card border border-border hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge className={`${getStatusColor(report.status)} text-base px-3 py-1`}>
                                    {report.status}
                                  </Badge>
                                  <span className="text-base text-muted-foreground">Week {report.weekNumber}</span>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">{report.studentName}</h3>
                                <p className="text-base text-muted-foreground line-clamp-2">{report.accomplishments}</p>
                                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {report.weekStartDate ? new Date(report.weekStartDate).toLocaleDateString() : 'N/A'} - {report.weekEndDate ? new Date(report.weekEndDate).toLocaleDateString() : 'N/A'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {report.hoursRendered} hours
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button 
                                  variant="outline"
                                  className="border-gray-300 hover:bg-gray-50 text-base py-5 px-6"
                                  onClick={() => handleViewReport(report)}
                                >
                                  <Eye className="w-5 h-5 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Evaluations Tab */}
                <TabsContent value="evaluations" className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-card border border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">{evaluationStats.total}</div>
                        <div className="text-base text-muted-foreground mt-1">Total Final Evaluations</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-primary">{evaluationStats.approved}</div>
                        <div className="text-base text-muted-foreground mt-1">Approved</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-yellow-600">{evaluationStats.pendingReview}</div>
                        <div className="text-base text-muted-foreground mt-1">Submitted</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Filters */}
                  <Card className="bg-card border border-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                          <Input
                            placeholder="Search by student name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 text-base border-border"
                          />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full md:w-56 h-11 text-base border-border">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="revision_requested">Revision Requested</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Evaluations List */}
                  <div className="space-y-4">
                    {loadingEvaluations ? (
                      <Card className="bg-card border border-border">
                        <CardContent className="py-16 text-center">
                          <p className="text-muted-foreground text-lg">Loading evaluations...</p>
                        </CardContent>
                      </Card>
                    ) : filteredEvaluations.length === 0 ? (
                      <Card className="bg-card border border-border">
                        <CardContent className="py-16 text-center">
                          <p className="text-muted-foreground text-lg">No evaluations found</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredEvaluations.map((evaluation) => (
                        <Card key={evaluation.id} className="bg-card border border-border hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge className={`${getStatusColor(evaluation.status)} text-base px-3 py-1`}>
                                    {evaluation.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-base px-3 py-1">
                                    Final Evaluation
                                  </Badge>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-1">{evaluation.studentName}</h3>
                                <p className="text-base text-muted-foreground mb-3">{evaluation.studentEmail}</p>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    {evaluation.company}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    {evaluation.position}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-primary">
                                    {evaluation.total_score ?? 'N/A'}/{getMaxScore(evaluation) || '—'}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">Total Score</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-foreground">
                                    {getPercentageScore(evaluation) ? `${getPercentageScore(evaluation)}%` : 'N/A'}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">Percentage</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-primary">
                                    {evaluation.final_grade?.toFixed(2) ?? 'N/A'}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">Final Grade</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button 
                                    variant="outline"
                                    className="border-border hover:bg-muted text-base py-5 px-6"
                                    onClick={() => handleViewEvaluation(evaluation)}
                                  >
                                    <Eye className="w-5 h-5 mr-2" />
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Evaluations & Reports"
          subtitle="Review student submissions"
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
            <TabsList className="w-full bg-white border border-gray-200 p-1">
              <TabsTrigger value="weekly-reports" className="flex-1 data-[state=active]:bg-[#4CAF50] data-[state=active]:text-white text-sm">
                Reports
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="flex-1 data-[state=active]:bg-[#4CAF50] data-[state=active]:text-white text-sm">
                Evaluations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly-reports" className="space-y-4">
              {/* Mobile stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{reportStats.pending}</div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-[#4CAF50]">{reportStats.approved}</div>
                    <div className="text-xs text-gray-600">Approved</div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile reports list */}
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <Badge className={`${getStatusColor(report.status)} text-xs px-2 py-1 mb-2`}>
                        {report.status}
                      </Badge>
                      <h3 className="font-semibold text-sm mb-1">{report.studentName}</h3>
                      <p className="text-xs text-gray-600 mb-2">Week {report.weekNumber}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => handleViewReport(report)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="evaluations" className="space-y-4">
              {/* Mobile stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{evaluationStats.pendingReview}</div>
                    <div className="text-xs text-gray-600">Submitted</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-[#4CAF50]">{evaluationStats.approved}</div>
                    <div className="text-xs text-gray-600">Approved</div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile evaluations list */}
              <div className="space-y-3">
                {filteredEvaluations.map((evaluation) => (
                  <Card key={evaluation.id}>
                    <CardContent className="p-4">
                      <Badge className={`${getStatusColor(evaluation.status)} text-xs px-2 py-1 mb-2`}>
                        {evaluation.status.replace('_', ' ')}
                      </Badge>
                      <h3 className="font-semibold text-sm mb-1">{evaluation.studentName}</h3>
                      <p className="text-xs text-gray-600 mb-2">{evaluation.company}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div className="text-lg font-bold text-[#4CAF50]">{evaluation.total_score ?? 'N/A'}/{getMaxScore(evaluation) || '—'}</div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{getPercentageScore(evaluation) ? `${getPercentageScore(evaluation)}%` : 'N/A'}</div>
                          <div className="text-xs text-gray-600">Percent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-[#4CAF50]">{evaluation.final_grade?.toFixed(2) ?? 'N/A'}</div>
                          <div className="text-xs text-gray-600">Grade</div>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleViewEvaluation(evaluation)}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <BottomNavigation type="advisor" />
      </div>

      {/* Weekly Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Weekly Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedReport.studentName}</h3>
                  <p className="text-base text-gray-600 mt-1">Week {selectedReport.weekNumber}</p>
                </div>
                <Badge className={`${getStatusColor(selectedReport.status)} text-base px-3 py-1`}>
                  {selectedReport.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <span className="text-gray-600">Week Period:</span>
                  <p className="font-semibold text-gray-900 mt-1">
                    {new Date(selectedReport.weekStartDate).toLocaleDateString()} - {new Date(selectedReport.weekEndDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Hours Rendered:</span>
                  <p className="font-semibold text-gray-900 mt-1">{selectedReport.hoursRendered} hours</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Accomplishments</h4>
                <p className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedReport.accomplishments}
                </p>
              </div>

              {selectedReport.challenges && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Challenges</h4>
                  <p className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedReport.challenges}
                  </p>
                </div>
              )}

              {selectedReport.learnings && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Learnings</h4>
                  <p className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedReport.learnings}
                  </p>
                </div>
              )}

              {selectedReport.supervisorComment && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Supervisor's Comment</h4>
                  <p className="text-base text-gray-700 bg-[#4CAF50]/5 p-4 rounded-lg border border-[#4CAF50]/20">
                    {selectedReport.supervisorComment}
                  </p>
                  {selectedReport.supervisorReviewedAt && (
                    <p className="text-sm text-gray-500 mt-2">
                      Reviewed on {new Date(selectedReport.supervisorReviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Evaluation Review Modal */}
      <Dialog open={isEvaluationModalOpen} onOpenChange={setIsEvaluationModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Evaluation Review</DialogTitle>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-6 mt-4">
              <div className="flex items-start justify-between pb-4 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedEvaluation.studentName}</h3>
                  <p className="text-base text-gray-600 mt-1">{selectedEvaluation.studentEmail}</p>
                  <p className="text-base text-gray-600 mt-1">{selectedEvaluation.position} at {selectedEvaluation.company}</p>
                </div>
                <div className="text-right">
                  <Badge className={`${getStatusColor(selectedEvaluation.status)} text-base px-3 py-1 mb-2`}>
                    {selectedEvaluation.status.replace('_', ' ')}
                  </Badge>
                  <p className="text-sm text-gray-500">
                    Submitted {new Date(selectedEvaluation.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Score Summary</h4>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-3xl font-bold text-[#4CAF50]">
                          {selectedEvaluation.total_score ?? 'N/A'}/{getMaxScore(selectedEvaluation) || '—'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Total Score</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900">
                          {getPercentageScore(selectedEvaluation) ? `${getPercentageScore(selectedEvaluation)}%` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Percentage</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#4CAF50]">
                          {selectedEvaluation.final_grade?.toFixed(2) ?? 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Final Grade</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Rubric Criteria Scores</h4>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-4 space-y-3">
                    {selectedEvaluation.criterion_scores && selectedEvaluation.criterion_scores.length > 0 ? (
                      selectedEvaluation.criterion_scores.map((score, idx) => (
                        <div key={`${score.criterion_code}-${idx}`} className="flex items-center justify-between p-2 border-b last:border-b-0">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{score.criterion_code}. {score.criterion_name}</p>
                          </div>
                          <p className="text-lg font-bold text-[#4CAF50]">{score.score}/10</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">No rubric scores available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Attendance & Punctuality</h4>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Attendance</p>
                      <Badge variant="outline" className="mt-1 capitalize">{selectedEvaluation.attendance || 'N/A'}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Punctuality</p>
                      <Badge variant="outline" className="mt-1 capitalize">{selectedEvaluation.punctuality || 'N/A'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Supervisor's Comment</h4>
                <p className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedEvaluation.supervisorComment || 'No comments provided.'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
