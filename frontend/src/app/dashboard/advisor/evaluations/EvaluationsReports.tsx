'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Eye,
  Building2,
  Search,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  status: 'submitted' | 'processed' | 'approved';
  submittedAt: string;
  approvedAt?: string;
}

export default function EvaluationsReports() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      console.log('📊 [Advisor Evaluations] Starting fetch via backend API...');
      setLoadingEvaluations(true);
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('❌ [Advisor Evaluations] No session found');
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      };

      // Fetch submitted (pending review) and approved evaluations in parallel
      // Backend uses service key — bypasses RLS entirely, reliable regardless of advisor_id column value
      const [submittedRes, approvedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/advisor/evaluations/pending`, { headers }),
        fetch(`${API_BASE_URL}/advisor/evaluations/status/approved`, { headers }),
      ]);

      const submittedJson = await submittedRes.json();
      const approvedJson = await approvedRes.json();

      console.log('✅ [Advisor Evaluations] Submitted (pending):', submittedJson?.data?.length || 0);
      console.log('✅ [Advisor Evaluations] Approved:', approvedJson?.data?.length || 0);

      const rawEvaluations: any[] = [
        ...(submittedJson?.data || []),
        ...(approvedJson?.data || []),
      ];

      console.log('📊 [Advisor Evaluations] Total raw evaluations:', rawEvaluations.length);

      const formatted: Evaluation[] = rawEvaluations.map((evaluation: any) => ({
        id: evaluation.id,
        internship_id: evaluation.internship_id,
        student_id: evaluation.student_id,
        supervisor_id: evaluation.supervisor_id,
        studentName: evaluation.student
          ? `${evaluation.student.first_name} ${evaluation.student.last_name}`
          : 'Unknown',
        studentEmail: evaluation.student?.email || 'Unknown',
        supervisorName: evaluation.supervisor
          ? `${evaluation.supervisor.first_name} ${evaluation.supervisor.last_name}`
          : 'Unknown',
        company: evaluation.internship?.companies?.name || 'Unknown',
        position: evaluation.internship?.position || 'Intern',
        evaluationType: 'final',
        rubric_id: evaluation.rubric_id,
        criterion_scores: evaluation.criterion_scores || [],
        total_score: evaluation.total_score,
        final_grade: evaluation.final_grade,
        attendance: evaluation.attendance,
        punctuality: evaluation.punctuality,
        supervisorComment: evaluation.supervisor_comments,
        status: evaluation.status,
        submittedAt: evaluation.submitted_at,
        approvedAt: evaluation.approved_at,
      }));

      console.log('✅ [Advisor Evaluations] Formatted', formatted.length, 'evaluations');
      setEvaluations(formatted);
    } catch (error: any) {
      console.error('❌ [Advisor Evaluations] Error:', error);
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

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => {
      const matchesSearch = evaluation.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evaluation.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || evaluation.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [evaluations, searchQuery, filterStatus]);

  const evaluationStats = {
    total: evaluations.length,
    pendingReview: evaluations.filter(e => e.status === 'submitted').length,
    approved: evaluations.filter(e => e.status === 'approved').length,
    processed: evaluations.filter(e => e.status === 'processed').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20';
      case 'processed': return 'bg-blue-100 text-blue-700 border-blue-200';
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

  const handleViewEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsEvaluationModalOpen(true);
  };

  return (
    <>
      <div className="space-y-8 p-8 xl:p-12">
              {/* Header */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Final Evaluations</h1>
                <p className="text-gray-600 mt-2 text-lg">Review and manage student final evaluations</p>
              </div>

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
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
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
            </div>
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
    </>
  );
}
