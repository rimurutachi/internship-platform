'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  User,
  Building2,
  Calendar,
  Download,
  MessageSquare,
  Search
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
import { Textarea } from '@/components/ui/textarea';
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
  studentName: string;
  studentEmail: string;
  company: string;
  position: string;
  evaluationType: 'midterm' | 'final';
  overallGrade: number;
  technicalScore: number;
  communicationScore: number;
  workEthicScore: number;
  status: 'pending_review' | 'approved' | 'revision_requested';
  submittedAt: string;
  supervisorComment: string;
  advisorComment?: string;
}

const mockEvaluations: Evaluation[] = [
  {
    id: '1',
    studentName: 'Alice Johnson',
    studentEmail: 'alice.j@university.edu',
    company: 'Tech Corp',
    position: 'Software Engineering Intern',
    evaluationType: 'midterm',
    overallGrade: 4.5,
    technicalScore: 4.7,
    communicationScore: 4.3,
    workEthicScore: 4.6,
    status: 'pending_review',
    submittedAt: '2025-11-08T15:30:00',
    supervisorComment: 'Alice has shown excellent technical skills and adapts quickly to new challenges. She communicates well with the team and consistently meets deadlines.'
  },
  {
    id: '2',
    studentName: 'Bob Martinez',
    studentEmail: 'bob.m@university.edu',
    company: 'DataWorks Inc',
    position: 'Data Analyst Intern',
    evaluationType: 'midterm',
    overallGrade: 4.2,
    technicalScore: 4.0,
    communicationScore: 4.4,
    workEthicScore: 4.3,
    status: 'approved',
    submittedAt: '2025-11-05T14:00:00',
    supervisorComment: 'Bob demonstrates strong analytical skills and attention to detail. His communication with stakeholders has improved significantly.',
    advisorComment: 'Approved. Bob is making good progress.'
  }
];

export default function EvaluationsReports() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'weekly-reports' | 'evaluations'>('weekly-reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [advisorComment, setAdvisorComment] = useState('');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    fetchWeeklyReports();
  }, []);

  const fetchWeeklyReports = async () => {
    try {
      setLoadingReports(true);
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No session token available');
      }

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

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, filterStatus]);

  const filteredEvaluations = mockEvaluations.filter(evaluation => {
    const matchesSearch = evaluation.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         evaluation.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || evaluation.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const reportStats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  }), [reports]);

  const evaluationStats = {
    total: mockEvaluations.length,
    pendingReview: mockEvaluations.filter(e => e.status === 'pending_review').length,
    approved: mockEvaluations.filter(e => e.status === 'approved').length,
    revisionRequested: mockEvaluations.filter(e => e.status === 'revision_requested').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20';
      case 'pending': case 'pending_review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': case 'revision_requested': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleViewReport = (report: WeeklyReport) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const handleViewEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setAdvisorComment(evaluation.advisorComment || '');
    setIsEvaluationModalOpen(true);
  };

  const handleApproveEvaluation = () => {
    // Backend integration will be added here
    console.log('Approve evaluation:', selectedEvaluation?.id, advisorComment);
    setIsEvaluationModalOpen(false);
  };

  const handleRequestRevision = () => {
    // Backend integration will be added here
    console.log('Request revision:', selectedEvaluation?.id, advisorComment);
    setIsEvaluationModalOpen(false);
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
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Evaluations & Reports</h1>
                <p className="text-gray-600 mt-2 text-lg">Review student weekly reports and final evaluations</p>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
                <TabsList className="bg-white border border-gray-200 p-1">
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
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-gray-900">{reportStats.total}</div>
                        <div className="text-base text-gray-600 mt-1">Total Reports</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-yellow-600">{reportStats.pending}</div>
                        <div className="text-base text-gray-600 mt-1">Pending Review</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-[#4CAF50]">{reportStats.approved}</div>
                        <div className="text-base text-gray-600 mt-1">Approved</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-red-600">{reportStats.rejected}</div>
                        <div className="text-base text-gray-600 mt-1">Rejected</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Filters */}
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            placeholder="Search by student name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 text-base border-gray-300"
                          />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full md:w-56 h-11 text-base border-gray-300">
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
                      <Card className="bg-white border border-gray-200">
                        <CardContent className="py-16 text-center">
                          <p className="text-gray-600 text-lg">Loading reports...</p>
                        </CardContent>
                      </Card>
                    ) : filteredReports.length === 0 ? (
                      <Card className="bg-white border border-gray-200">
                        <CardContent className="py-16 text-center">
                          <p className="text-gray-600 text-lg">No reports found</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredReports.map((report) => (
                        <Card key={report.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge className={`${getStatusColor(report.status)} text-base px-3 py-1`}>
                                    {report.status}
                                  </Badge>
                                  <span className="text-base text-gray-600">Week {report.weekNumber}</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{report.studentName}</h3>
                                <p className="text-base text-gray-600 line-clamp-2">{report.accomplishments}</p>
                                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-gray-900">{evaluationStats.total}</div>
                        <div className="text-base text-gray-600 mt-1">Total Evaluations</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-yellow-600">{evaluationStats.pendingReview}</div>
                        <div className="text-base text-gray-600 mt-1">Awaiting Review</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-[#4CAF50]">{evaluationStats.approved}</div>
                        <div className="text-base text-gray-600 mt-1">Approved</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-red-600">{evaluationStats.revisionRequested}</div>
                        <div className="text-base text-gray-600 mt-1">Revision Requested</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Filters */}
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            placeholder="Search by student name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 text-base border-gray-300"
                          />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full md:w-56 h-11 text-base border-gray-300">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending_review">Pending Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="revision_requested">Revision Requested</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Evaluations List */}
                  <div className="space-y-4">
                    {filteredEvaluations.length === 0 ? (
                      <Card className="bg-white border border-gray-200">
                        <CardContent className="py-16 text-center">
                          <p className="text-gray-600 text-lg">No evaluations found</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredEvaluations.map((evaluation) => (
                        <Card key={evaluation.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge className={`${getStatusColor(evaluation.status)} text-base px-3 py-1`}>
                                    {evaluation.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-base px-3 py-1">
                                    {evaluation.evaluationType}
                                  </Badge>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-1">{evaluation.studentName}</h3>
                                <p className="text-base text-gray-600 mb-3">{evaluation.studentEmail}</p>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
                                  <div className="text-3xl font-bold text-[#4CAF50]">{evaluation.overallGrade}</div>
                                  <div className="text-sm text-gray-600 mt-1">Overall Grade</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button 
                                    className="bg-[#4CAF50] hover:bg-[#45a049] text-white text-base py-5 px-6"
                                    onClick={() => handleViewEvaluation(evaluation)}
                                  >
                                    <Eye className="w-5 h-5 mr-2" />
                                    Review & Approve
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
                    <div className="text-xs text-gray-600">Pending</div>
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
                          <div className="text-xl font-bold text-[#4CAF50]">{evaluation.overallGrade}</div>
                          <div className="text-xs text-gray-600">Grade</div>
                        </div>
                        <Button 
                          size="sm"
                          className="bg-[#4CAF50] hover:bg-[#45a049] text-xs"
                          onClick={() => handleViewEvaluation(evaluation)}
                        >
                          Review
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
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Scores</h4>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-[#4CAF50] mb-1">{selectedEvaluation.overallGrade}</div>
                        <div className="text-base text-gray-600">Overall Grade</div>
                      </div>
                      <div className="text-center">
                        <Badge className="bg-purple-100 text-purple-700 text-base px-3 py-1">
                          {selectedEvaluation.evaluationType} Evaluation
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{selectedEvaluation.technicalScore}/5</div>
                        <div className="text-sm text-gray-600">Technical</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{selectedEvaluation.communicationScore}/5</div>
                        <div className="text-sm text-gray-600">Communication</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{selectedEvaluation.workEthicScore}/5</div>
                        <div className="text-sm text-gray-600">Work Ethic</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Supervisor's Comment</h4>
                <p className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedEvaluation.supervisorComment}
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Advisor's Comment / Decision</h4>
                <Textarea
                  value={advisorComment}
                  onChange={(e) => setAdvisorComment(e.target.value)}
                  placeholder="Add your comments or feedback here..."
                  className="min-h-32 text-base border-gray-300"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white text-base py-6"
                  onClick={handleApproveEvaluation}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approve Evaluation
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50 text-base py-6"
                  onClick={handleRequestRevision}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Request Revision
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
