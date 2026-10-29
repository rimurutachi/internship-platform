'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Eye,
  Building2,
  Search,
  UserCheck,
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
import { cn } from '@/lib/utils';

// Standard CvSU rubric criterion scale descriptions (1-10 scale in 5 tiers)
const CVSU_SCALE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  A: {
    '1-2': 'Work is incomplete, inaccurate, or careless',
    '3-4': 'Work meets minimum standards but lacks attention to detail',
    '5-6': 'Work is adequate and meets basic expectations',
    '7-8': 'Work is thorough, accurate, and well-executed',
    '9-10': 'Work exceeds expectations with exceptional quality',
  },
  B: {
    '1-2': 'Shows disinterest or negative attitude',
    '3-4': 'Attitude is occasionally negative or unmotivated',
    '5-6': 'Maintains professional attitude most of the time',
    '7-8': 'Consistently positive and enthusiastic',
    '9-10': 'Highly motivated with exceptional enthusiasm',
  },
  C: {
    '1-2': 'Consistently uses poor judgment without considering consequences',
    '3-4': 'Judgment is sometimes questionable or lacks depth',
    '5-6': 'Makes reasonable and sound decisions in most situations',
    '7-8': 'Demonstrates sound judgment and analytical thinking consistently',
    '9-10': 'Exceptionally mature; excellent problem-solving and decision-making skills',
  },
  D: {
    '1-2': 'Difficult to work with, uncooperative with team members',
    '3-4': 'Sometimes struggles with teamwork and collaboration',
    '5-6': 'Works adequately and cooperatively with others',
    '7-8': 'Collaborates well and contributes actively to team goals',
    '9-10': 'Outstanding team player; facilitates cooperation and inspires others',
  },
  E: {
    '1-2': 'Frequently undependable or misses deadlines',
    '3-4': 'Occasionally unreliable in completing assignments',
    '5-6': 'Generally dependable and completes tasks on time',
    '7-8': 'Consistently reliable and punctual in all situations',
    '9-10': 'Exceptionally dependable in all tasks; inspires complete confidence',
  },
  F: {
    '1-2': 'Struggles to grasp instructions or job concepts',
    '3-4': 'Requires more than average instruction and repetition',
    '5-6': 'Understands instructions with average explanation',
    '7-8': 'Quickly grasps new concepts and requires minimal instruction',
    '9-10': 'Understands instructions instantly; exceeds learning standards',
  },
  G: {
    '1-2': 'Careless or disregards basic safety protocols',
    '3-4': 'Sometimes neglects safety procedures or needs reminders',
    '5-6': 'Observes basic workplace safety guidelines and practices',
    '7-8': 'Consistently proactive and adheres to all safety protocols',
    '9-10': 'Exemplary safety awareness; quick to identify and mitigate hazards',
  },
};

const getScoreRating = (score: number) => {
  if (score >= 9) {
    return {
      label: 'Outstanding',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
    };
  }
  if (score >= 7) {
    return {
      label: 'Very Good',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300',
    };
  }
  if (score >= 5) {
    return {
      label: 'Satisfactory',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300',
    };
  }
  if (score >= 3) {
    return {
      label: 'Fairly Satisfactory',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
    };
  }
  return {
    label: 'Poor',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300',
  };
};

const getScaleKey = (score: number): string => {
  if (score >= 9) return '9-10';
  if (score >= 7) return '7-8';
  if (score >= 5) return '5-6';
  if (score >= 3) return '3-4';
  return '1-2';
};

const getCriterionDescription = (
  criterionCode: string,
  criterionName: string,
  score: number,
  rubric?: any
): string => {
  const scaleKey = getScaleKey(score);

  // 1. Check if rubric has criteria scale descriptions
  if (rubric?.criteria && Array.isArray(rubric.criteria)) {
    const matched = rubric.criteria.find(
      (c: any) =>
        c.code?.toLowerCase() === criterionCode?.toLowerCase() ||
        c.name?.toLowerCase() === criterionName?.toLowerCase()
    );
    if (matched?.scale_descriptions?.[scaleKey]) {
      return matched.scale_descriptions[scaleKey];
    }
  }

  // 2. Fall back to standard CvSU scale descriptions by code
  const codeKey = (criterionCode || '').toUpperCase().trim();
  if (CVSU_SCALE_DESCRIPTIONS[codeKey]?.[scaleKey]) {
    return CVSU_SCALE_DESCRIPTIONS[codeKey][scaleKey];
  }

  // 3. Match by name keyword if code didn't match
  const lowerName = (criterionName || '').toLowerCase();
  for (const [code, descMap] of Object.entries(CVSU_SCALE_DESCRIPTIONS)) {
    if (
      (code === 'A' && lowerName.includes('quality')) ||
      (code === 'B' && lowerName.includes('attitude')) ||
      (code === 'C' && lowerName.includes('judgment')) ||
      (code === 'D' && lowerName.includes('cooperation')) ||
      (code === 'E' && lowerName.includes('dependability')) ||
      (code === 'F' && lowerName.includes('comprehension')) ||
      (code === 'G' && lowerName.includes('safety'))
    ) {
      if (descMap[scaleKey]) return descMap[scaleKey];
    }
  }

  // 4. Fallback description
  const rating = getScoreRating(score).label;
  return `Performance level evaluated as ${rating} (${scaleKey} point range).`;
};

const formatCriterionTitle = (code: string, name: string): string => {
  const trimmed = (name || '').trim();
  if (/^[A-Za-z]\s*[\.\-\:]\s*/.test(trimmed)) {
    return trimmed;
  }
  return code ? `${code}. ${trimmed}` : trimmed;
};

const getDisplayStatus = (status: string) => {
  if (status === 'approved' || status === 'submitted') {
    return 'Submitted';
  }
  if (status === 'processed') {
    return 'Processed';
  }
  if (status === 'revision_requested') {
    return 'Revision Needed';
  }
  return status.replace('_', ' ');
};

interface Evaluation {
  id: string;
  internship_id: string;
  student_id: string;
  supervisor_id: string;
  studentName: string;
  studentEmail: string;
  supervisorName: string;
  supervisorEmail?: string;
  company: string;
  position: string;
  evaluationType: 'final';
  rubric_id?: string | null;
  rubric?: any;
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
        Authorization: `Bearer ${session.access_token}`,
      };

      // Fetch submitted and approved evaluations in parallel
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
          : 'Unknown Student',
        studentEmail: evaluation.student?.email || 'Unknown',
        supervisorName: evaluation.supervisor
          ? `${evaluation.supervisor.first_name} ${evaluation.supervisor.last_name}`
          : 'Unknown Supervisor',
        supervisorEmail: evaluation.supervisor?.email,
        company: evaluation.internship?.companies?.name || 'Unknown',
        position: evaluation.internship?.position || 'Intern',
        evaluationType: 'final',
        rubric_id: evaluation.rubric_id,
        rubric: evaluation.rubric,
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
      const matchesSearch =
        evaluation.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evaluation.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evaluation.supervisorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evaluation.company.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = true;
      if (filterStatus === 'submitted') {
        matchesStatus = evaluation.status === 'submitted' || evaluation.status === 'approved';
      } else if (filterStatus !== 'all') {
        matchesStatus = evaluation.status === filterStatus;
      }

      return matchesSearch && matchesStatus;
    });
  }, [evaluations, searchQuery, filterStatus]);

  const evaluationStats = {
    total: evaluations.length,
    submitted: evaluations.filter((e) => e.status === 'submitted' || e.status === 'approved').length,
    averageGrade: (() => {
      const graded = evaluations.filter((e) => typeof e.final_grade === 'number' && e.final_grade > 0);
      if (graded.length === 0) return 'N/A';
      const sum = graded.reduce((acc, curr) => acc + (curr.final_grade || 0), 0);
      return (sum / graded.length).toFixed(2);
    })(),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'submitted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
      case 'processed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      case 'revision_requested':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
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
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{evaluationStats.submitted}</div>
              <div className="text-base text-muted-foreground mt-1">Submitted</div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary">{evaluationStats.averageGrade}</div>
              <div className="text-base text-muted-foreground mt-1">Average Final Grade</div>
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
                  placeholder="Search by student, supervisor, or company..."
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
                          {getDisplayStatus(evaluation.status)}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-base px-3 py-1 font-semibold">
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
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Supervisor: {evaluation.supervisorName}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 lg:mt-0">
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
                  
                  {/* Supervisor Information */}
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-800 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg px-3.5 py-2 w-fit">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Evaluated by Supervisor:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedEvaluation.supervisorName}
                    </span>
                    {selectedEvaluation.supervisorEmail && (
                      <span className="text-gray-500 text-xs">({selectedEvaluation.supervisorEmail})</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${getStatusColor(selectedEvaluation.status)} text-base px-3 py-1 mb-2 capitalize`}>
                    {getDisplayStatus(selectedEvaluation.status)}
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
                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
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
                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                          {selectedEvaluation.final_grade?.toFixed(2) ?? 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Final Grade</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Rubric Criteria Scores</h4>
                  <span className="text-xs text-muted-foreground">Evaluated on a 1–10 point scale</span>
                </div>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-4 space-y-3">
                    {selectedEvaluation.criterion_scores && selectedEvaluation.criterion_scores.length > 0 ? (
                      selectedEvaluation.criterion_scores.map((score, idx) => {
                        const rating = getScoreRating(score.score);
                        const description = getCriterionDescription(
                          score.criterion_code,
                          score.criterion_name,
                          score.score,
                          selectedEvaluation.rubric
                        );
                        const title = formatCriterionTitle(score.criterion_code, score.criterion_name);

                        return (
                          <div
                            key={`${score.criterion_code}-${idx}`}
                            className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-gray-900">
                                  {title}
                                </span>
                                <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', rating.badgeClass)}>
                                  {rating.label}
                                </Badge>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                                  {score.score}/10
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed italic bg-white p-2.5 rounded border border-gray-100">
                              "{description}"
                            </p>
                          </div>
                        );
                      })
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

