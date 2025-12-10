'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  User,
  Building2,
  Loader2,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Award,
  Eye
} from 'lucide-react';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase';

interface Evaluation {
  id: string;
  internship_id: string;
  student_id: string;
  supervisor_id: string;
  student_name: string;
  student_email: string;
  supervisor_name: string;
  company_name: string;
  position: string;
  evaluation_type: string;
  
  // CvSU Criteria
  quality_of_work: number;
  attitude: number;
  judgment: number;
  cooperation: number;
  dependability: number;
  comprehension: number;
  safety: number;
  
  // Attendance
  total_days: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  
  // Scores
  total_score: number;
  percentage_score: number;
  final_grade: number;
  
  // Comments & Status
  comments: string;
  status: 'submitted' | 'revision_requested' | 'approved';
  submitted_at: string;
  approved_at?: string;
  approval_comments?: string;
  revision_reason?: string;
  
  // Grade override
  grade_override?: number;
  grade_override_reason?: string;
}

interface WeeklyReport {
  id: string;
  week_number: number;
  accomplishments: string;
  hours_rendered: number;
  challenges?: string;
  learnings?: string;
  status: string;
  week_start_date: string;
  week_end_date: string;
}

interface EvaluationStatistics {
  total: number;
  awaiting_review: number;
  revision_requested: number;
  approved: number;
}

export default function AdvisorEvaluations() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data state
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [statistics, setStatistics] = useState<EvaluationStatistics>({
    total: 0,
    awaiting_review: 0,
    revision_requested: 0,
    approved: 0,
  });
  
  // Filter state
  const [activeTab, setActiveTab] = useState<'submitted' | 'revision_requested' | 'approved'>('submitted');
  
  // Dialog states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  
  // Form state
  const [approvalComments, setApprovalComments] = useState('');
  const [gradeOverride, setGradeOverride] = useState<number | null>(null);
  const [gradeOverrideReason, setGradeOverrideReason] = useState('');
  const [revisionReason, setRevisionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterEvaluations();
  }, [evaluations, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all evaluations for students under this advisor
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('evaluations')
        .select(`
          *,
          internships!evaluations_internship_id_fkey(
            id,
            position,
            student_id,
            supervisor_id,
            companies(name)
          ),
          users!evaluations_student_id_fkey(
            id,
            email,
            first_name,
            last_name
          ),
          supervisor:users!evaluations_supervisor_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('evaluation_type', 'final')
        .in('status', ['submitted', 'revision_requested', 'approved'])
        .order('submitted_at', { ascending: false });

      if (evaluationsError) throw evaluationsError;

      // Filter evaluations for students under this advisor
      const { data: advisedStudents } = await supabase
        .from('internships')
        .select('student_id')
        .eq('advisor_id', user.id);

      const advisedStudentIds = (advisedStudents || []).map(s => s.student_id);

      const formattedEvaluations: Evaluation[] = (evaluationsData || [])
        .filter((evaluation: any) => advisedStudentIds.includes(evaluation.student_id))
        .map((evaluation: any) => ({
          id: evaluation.id,
          internship_id: evaluation.internship_id,
          student_id: evaluation.student_id,
          supervisor_id: evaluation.supervisor_id,
          student_name: evaluation.users 
            ? `${evaluation.users.first_name} ${evaluation.users.last_name}` 
            : 'Unknown',
          student_email: evaluation.users?.email || '',
          supervisor_name: evaluation.supervisor 
            ? `${evaluation.supervisor.first_name} ${evaluation.supervisor.last_name}`
            : 'Unknown',
          company_name: (evaluation.internships?.companies as any)?.name || 'Unknown',
          position: evaluation.internships?.position || '',
          evaluation_type: evaluation.evaluation_type,
          
          quality_of_work: evaluation.quality_of_work,
          attitude: evaluation.attitude,
          judgment: evaluation.judgment,
          cooperation: evaluation.cooperation,
          dependability: evaluation.dependability,
          comprehension: evaluation.comprehension,
          safety: evaluation.safety,
          
          total_days: evaluation.total_days,
          days_present: evaluation.days_present,
          days_absent: evaluation.days_absent,
          days_late: evaluation.days_late,
          
          total_score: evaluation.total_score,
          percentage_score: evaluation.percentage_score,
          final_grade: evaluation.final_grade,
          
          comments: evaluation.comments,
          status: evaluation.status,
          submitted_at: evaluation.submitted_at,
          approved_at: evaluation.approved_at,
          approval_comments: evaluation.approval_comments,
          revision_reason: evaluation.revision_reason,
          grade_override: evaluation.grade_override,
          grade_override_reason: evaluation.grade_override_reason,
        }));

      setEvaluations(formattedEvaluations);

      // Calculate statistics
      const stats: EvaluationStatistics = {
        total: formattedEvaluations.length,
        awaiting_review: formattedEvaluations.filter(e => e.status === 'submitted').length,
        revision_requested: formattedEvaluations.filter(e => e.status === 'revision_requested').length,
        approved: formattedEvaluations.filter(e => e.status === 'approved').length,
      };
      setStatistics(stats);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch evaluations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReports = async (internshipId: string) => {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('student_weekly_accomplishments')
        .select('*')
        .eq('internship_id', internshipId)
        .eq('status', 'approved')
        .order('week_number', { ascending: true });

      if (error) throw error;
      setWeeklyReports(data || []);
    } catch (error: any) {
      console.error('Failed to fetch weekly reports:', error);
      setWeeklyReports([]);
    }
  };

  const filterEvaluations = () => {
    const filtered = evaluations.filter(e => e.status === activeTab);
    setFilteredEvaluations(filtered);
  };

  const openReviewDialog = async (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setApprovalComments('');
    setGradeOverride(null);
    setGradeOverrideReason('');
    setRevisionReason('');
    
    // Fetch weekly reports for context
    await fetchWeeklyReports(evaluation.internship_id);
    
    setReviewDialogOpen(true);
  };

  const handleApproveEvaluation = async () => {
    if (!selectedEvaluation) return;

    // Validation
    if (gradeOverride !== null) {
      if (gradeOverride < 1.0 || gradeOverride > 5.0) {
        toast({
          title: 'Validation Error',
          description: 'Grade override must be between 1.0 and 5.0',
          variant: 'destructive',
        });
        return;
      }

      if (!gradeOverrideReason || gradeOverrideReason.trim().length < 20) {
        toast({
          title: 'Validation Error',
          description: 'Grade override justification must be at least 20 characters',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      const supabase = createSupabaseClient();

      const updateData: any = {
        status: 'approved',
        approval_comments: approvalComments || null,
        approved_at: new Date().toISOString(),
      };

      if (gradeOverride !== null) {
        updateData.grade_override = gradeOverride;
        updateData.grade_override_reason = gradeOverrideReason.trim();
      }

      const { error } = await supabase
        .from('evaluations')
        .update(updateData)
        .eq('id', selectedEvaluation.id);

      if (error) throw error;

      toast({
        title: 'Evaluation Approved',
        description: `Evaluation for ${selectedEvaluation.student_name} has been approved`,
      });

      setReviewDialogOpen(false);
      setSelectedEvaluation(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve evaluation',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedEvaluation) return;

    if (!revisionReason || revisionReason.trim().length < 20) {
      toast({
        title: 'Validation Error',
        description: 'Revision feedback must be at least 20 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createSupabaseClient();

      const { error } = await supabase
        .from('evaluations')
        .update({
          status: 'revision_requested',
          revision_reason: revisionReason.trim(),
        })
        .eq('id', selectedEvaluation.id);

      if (error) throw error;

      toast({
        title: 'Revision Requested',
        description: `Supervisor will be notified to revise the evaluation`,
      });

      setReviewDialogOpen(false);
      setSelectedEvaluation(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request revision',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400';
      case 'revision_requested': return 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400';
      case 'submitted': return 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'revision_requested': return <XCircle className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
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
        <AdvisorSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdvisorHeader />
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Evaluation Review</h1>
                  <p className="text-muted-foreground mt-1">Review and approve final evaluations</p>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Refresh
                </Button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground">{statistics.total}</div>
                    <div className="text-sm text-muted-foreground">Total Evaluations</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statistics.awaiting_review}</div>
                    <div className="text-sm text-muted-foreground">Awaiting Review</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{statistics.revision_requested}</div>
                    <div className="text-sm text-muted-foreground">Revision Requested</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.approved}</div>
                    <div className="text-sm text-muted-foreground">Approved</div>
                  </CardContent>
                </Card>
              </div>

              {/* Evaluations Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Final Evaluations</CardTitle>
                  <CardDescription>Review supervisor evaluations for your advisees</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="submitted">
                        Awaiting Review ({statistics.awaiting_review})
                      </TabsTrigger>
                      <TabsTrigger value="revision_requested">
                        Revision Requested ({statistics.revision_requested})
                      </TabsTrigger>
                      <TabsTrigger value="approved">
                        Approved ({statistics.approved})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                      {filteredEvaluations.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">
                            No evaluations in this category
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredEvaluations.map((evaluation) => (
                            <Card key={evaluation.id} className="hover:shadow-card transition-shadow">
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-semibold text-foreground">
                                          {evaluation.student_name}
                                        </span>
                                      </div>
                                      <Badge className={getStatusColor(evaluation.status)}>
                                        <div className="flex items-center gap-1">
                                          {getStatusIcon(evaluation.status)}
                                          {evaluation.status.replace('_', ' ')}
                                        </div>
                                      </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                      <div className="flex items-center gap-1">
                                        <Building2 className="w-4 h-4" />
                                        {evaluation.company_name}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Award className="w-4 h-4" />
                                        {evaluation.position}
                                      </div>
                                      <div className="text-xs bg-muted px-2 py-1 rounded">
                                        Supervisor: {evaluation.supervisor_name}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">Total Score:</span>
                                        <span className="font-bold text-foreground ml-2">
                                          {evaluation.total_score}/70
                                        </span>
                                      </div>
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">Percentage:</span>
                                        <span className="font-bold text-foreground ml-2">
                                          {evaluation.percentage_score}%
                                        </span>
                                      </div>
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">Grade:</span>
                                        <span className="font-bold text-primary ml-2">
                                          {evaluation.grade_override || evaluation.final_grade.toFixed(2)}
                                          {evaluation.grade_override && ' (Override)'}
                                        </span>
                                      </div>
                                    </div>

                                    {evaluation.revision_reason && (
                                      <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-md">
                                        <p className="text-sm text-orange-600 dark:text-orange-400">
                                          <strong>Revision Requested:</strong> {evaluation.revision_reason}
                                        </p>
                                      </div>
                                    )}

                                    {evaluation.approval_comments && (
                                      <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                          <MessageSquare className="w-4 h-4 inline mr-1" />
                                          <strong>Approval Comments:</strong> {evaluation.approval_comments}
                                        </p>
                                      </div>
                                    )}

                                    <div className="text-xs text-muted-foreground mt-3">
                                      Submitted: {formatDateTime(evaluation.submitted_at)}
                                      {evaluation.approved_at && (
                                        <> • Approved: {formatDateTime(evaluation.approved_at)}</>
                                      )}
                                    </div>
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openReviewDialog(evaluation)}
                                    className="ml-4"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    {evaluation.status === 'submitted' ? 'Review' : 'View Details'}
                                  </Button>
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
          title="Evaluation Review"
          subtitle="Review & Approve"
        />

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Mobile Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{statistics.awaiting_review}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{statistics.revision_requested}</div>
                  <div className="text-xs text-muted-foreground">Revision</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{statistics.approved}</div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Tabs */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="submitted" className="text-xs">
                  Awaiting
                </TabsTrigger>
                <TabsTrigger value="revision_requested" className="text-xs">
                  Revision
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs">
                  Approved
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredEvaluations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">No evaluations</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredEvaluations.map((evaluation) => (
                      <Card key={evaluation.id}>
                        <CardContent className="pt-4 pb-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold text-sm">{evaluation.student_name}</div>
                                <div className="text-xs text-muted-foreground">{evaluation.company_name}</div>
                              </div>
                              <Badge className={getStatusColor(evaluation.status)} style={{ fontSize: '0.65rem' }}>
                                {evaluation.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="text-muted-foreground">Score</div>
                                <div className="font-bold">{evaluation.total_score}/70</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Percent</div>
                                <div className="font-bold">{evaluation.percentage_score}%</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Grade</div>
                                <div className="font-bold text-primary">
                                  {evaluation.grade_override || evaluation.final_grade.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => openReviewDialog(evaluation)}
                            >
                              {evaluation.status === 'submitted' ? 'Review Evaluation' : 'View Details'}
                            </Button>
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

        <BottomNavigation type="advisor" />
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Evaluation Review - {selectedEvaluation?.student_name}
              {selectedEvaluation && (
                <Badge className={`ml-2 ${getStatusColor(selectedEvaluation.status)}`}>
                  {selectedEvaluation.status.replace('_', ' ')}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedEvaluation?.position} at {selectedEvaluation?.company_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvaluation && (
            <Tabs defaultValue="evaluation" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="evaluation">Evaluation Details</TabsTrigger>
                <TabsTrigger value="weekly-reports">
                  Weekly Reports ({weeklyReports.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="evaluation" className="space-y-4 mt-4">
                {/* Score Summary */}
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{selectedEvaluation.total_score}/70</div>
                        <div className="text-xs text-muted-foreground">Total Score</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{selectedEvaluation.percentage_score}%</div>
                        <div className="text-xs text-muted-foreground">Percentage</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {selectedEvaluation.grade_override || selectedEvaluation.final_grade.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedEvaluation.grade_override ? 'Grade (Override)' : 'Final Grade'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CvSU Criteria Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance Criteria (CvSU)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">A. Quality of Work</div>
                        <div className="text-lg font-bold text-foreground">{selectedEvaluation.quality_of_work}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">B. Attitude</div>
                        <div className="text-lg font-bold text-foreground">{selectedEvaluation.attitude}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">C. Judgment</div>
                        <div className="text-lg font-bold text-foreground">{selectedEvaluation.judgment}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">D. Cooperation</div>
                        <div className="text-lg font-bold text-foreground">{selectedEvaluation.cooperation}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">E. Dependability</div>
                        <div className="text-lg font-bold text-foreground">{selectedEvaluation.dependability}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">F. Comprehension</div>
                        <div className="text-lg font-bold text-foreground">{selectedEvaluation.comprehension}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">G. Safety</div>
                        <div className="text-lg font-bold text-foreground">{selectedEvaluation.safety}/10</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Attendance & Punctuality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Total Days</div>
                        <div className="text-lg font-bold text-foreground">{selectedEvaluation.total_days}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Present</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{selectedEvaluation.days_present}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Absent</div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">{selectedEvaluation.days_absent}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Late</div>
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{selectedEvaluation.days_late}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supervisor Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Supervisor Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedEvaluation.comments}
                    </p>
                  </CardContent>
                </Card>

                {/* Review Actions */}
                {selectedEvaluation.status === 'submitted' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Your Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Grade Override (Optional)</Label>
                        <div className="flex gap-3 mt-2">
                          <Input
                            type="number"
                            min="1.0"
                            max="5.0"
                            step="0.25"
                            placeholder="e.g., 1.75"
                            value={gradeOverride || ''}
                            onChange={(e) => setGradeOverride(e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-32"
                          />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                              Current grade: {selectedEvaluation.final_grade.toFixed(2)} 
                              • Override range: 1.0 (highest) to 5.0 (lowest)
                            </p>
                          </div>
                        </div>
                        {gradeOverride !== null && (
                          <div className="mt-2">
                            <Label>Justification for Grade Override <span className="text-destructive">*</span></Label>
                            <Textarea
                              placeholder="Explain why you are overriding the grade (minimum 20 characters)..."
                              value={gradeOverrideReason}
                              onChange={(e) => setGradeOverrideReason(e.target.value)}
                              rows={3}
                              className="mt-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {gradeOverrideReason.length} / 20 characters minimum
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Approval Comments (Optional)</Label>
                        <Textarea
                          placeholder="Add any additional comments or feedback..."
                          value={approvalComments}
                          onChange={(e) => setApprovalComments(e.target.value)}
                          rows={3}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Request Revision</Label>
                        <Textarea
                          placeholder="If evaluation needs revision, explain what needs to be changed (minimum 20 characters)..."
                          value={revisionReason}
                          onChange={(e) => setRevisionReason(e.target.value)}
                          rows={3}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {revisionReason.length} / 20 characters minimum
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedEvaluation.revision_reason && (
                  <Card className="bg-orange-500/10 border-orange-500/20">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        <strong>Previous Revision Request:</strong> {selectedEvaluation.revision_reason}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedEvaluation.grade_override_reason && (
                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        <strong>Grade Override Reason:</strong> {selectedEvaluation.grade_override_reason}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="weekly-reports" className="space-y-3 mt-4">
                {weeklyReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No approved weekly reports available</p>
                  </div>
                ) : (
                  weeklyReports.map((report) => (
                    <Card key={report.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Week {report.week_number}</CardTitle>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {report.hours_rendered}h
                          </Badge>
                        </div>
                        <CardDescription>
                          {formatDate(report.week_start_date)} - {formatDate(report.week_end_date)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <Label className="text-xs font-semibold">Accomplishments</Label>
                          <p className="text-muted-foreground mt-1">{report.accomplishments}</p>
                        </div>
                        {report.challenges && (
                          <div>
                            <Label className="text-xs font-semibold">Challenges</Label>
                            <p className="text-muted-foreground mt-1">{report.challenges}</p>
                          </div>
                        )}
                        {report.learnings && (
                          <div>
                            <Label className="text-xs font-semibold">Learnings</Label>
                            <p className="text-muted-foreground mt-1">{report.learnings}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            {selectedEvaluation?.status === 'submitted' && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleRequestRevision}
                  disabled={submitting || revisionReason.length < 20}
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Request Revision
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleApproveEvaluation}
                  disabled={submitting || (gradeOverride !== null && gradeOverrideReason.length < 20)}
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Approve Evaluation
                </Button>
              </div>
            )}
            {selectedEvaluation?.status !== 'submitted' && (
              <Button onClick={() => setReviewDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
