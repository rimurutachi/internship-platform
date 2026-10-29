/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * View Evaluation Modal (Admin)
 * 
 * Detailed, rubric-based evaluation review matching the modern Advisor standard.
 * Features unified single-modal layout, supervisor callout, score summary metrics,
 * detailed CvSU rubric scale descriptions, and integrated timeline history.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EvaluationWithRelations } from '@/types/api';
import { convertScoreToGrade } from './gradeUtils';
import { UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewEvaluationModalProps {
  evaluation: EvaluationWithRelations | null;
  open: boolean;
  onClose: () => void;
}

// Standard CvSU Rubric Criteria Scale Descriptions (A - G)
const CVSU_SCALE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  A: {
    '1-2': 'Consistently fails to meet basic quality standards; frequent errors',
    '3-4': 'Sometimes produces subpar work or requires frequent revisions',
    '5-6': 'Meets acceptable quality standards with occasional minor errors',
    '7-8': 'Consistently produces high-quality, thorough, and accurate work',
    '9-10': 'Work exceeds expectations with exceptional quality',
  },
  B: {
    '1-2': 'Shows negative attitude or lack of enthusiasm toward work',
    '3-4': 'Inconsistent attitude; occasionally lacks motivation',
    '5-6': 'Demonstrates positive and cooperative work attitude',
    '7-8': 'Consistently enthusiastic, motivated, and engaged',
    '9-10': 'Highly motivated with exceptional enthusiasm',
  },
  C: {
    '1-2': 'Poor decision-making; fails to exercise sound judgment',
    '3-4': 'Hesitant or inconsistent in making sound workplace decisions',
    '5-6': 'Makes reasonable decisions under standard supervision',
    '7-8': 'Demonstrates sound, reliable judgment and problem-solving',
    '9-10': 'Exceptional problem-solving and decision-making skills',
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
  score: number
): string => {
  const scaleKey = getScaleKey(score);
  const codeKey = (criterionCode || '').toUpperCase().trim();

  // 1. Direct match by code
  if (CVSU_SCALE_DESCRIPTIONS[codeKey]?.[scaleKey]) {
    return CVSU_SCALE_DESCRIPTIONS[codeKey][scaleKey];
  }

  // 2. Keyword fallback by criterion name
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

  const rating = getScoreRating(score).label;
  return `Performance level evaluated as ${rating} (${scaleKey} point range).`;
};

// Prevents duplicate prefixes like "A. A. Quality of Work"
const formatCriterionTitle = (code: string, name: string): string => {
  const trimmed = (name || '').trim();
  if (/^[A-Za-z]\s*[\.\-\:]\s*/.test(trimmed)) {
    return trimmed;
  }
  return code ? `${code}. ${trimmed}` : trimmed;
};

export function ViewEvaluationModal({ evaluation, open, onClose }: ViewEvaluationModalProps) {
  if (!evaluation) return null;

  const criterionScores = (evaluation.criterion_scores as any[]) || [];
  const student = evaluation.internship?.student;
  const supervisor = evaluation.internship?.supervisor;
  const company = evaluation.internship?.company;
  const position = evaluation.internship?.position || 'Student Intern';

  const totalScore = evaluation.total_score ?? null;
  const percentageScore = totalScore !== null ? ((totalScore / 70) * 100).toFixed(1) : null;
  const finalGrade = totalScore !== null 
    ? convertScoreToGrade(totalScore)
    : evaluation.final_grade ?? null;

  const submittedDate = evaluation.submitted_at || evaluation.created_at;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Evaluation Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Header Info Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b">
            <div>
              <h3 className="text-xl font-semibold text-foreground">{student?.name || 'Unknown Student'}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{student?.email || 'N/A'}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {position} at {company?.name || 'Unknown Company'}
              </p>

              {/* Evaluated by Supervisor Callout */}
              <div className="mt-3 flex items-center gap-2 text-sm bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg px-3.5 py-2 w-fit">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-muted-foreground">Evaluated by Supervisor:</span>
                <span className="font-semibold text-foreground">
                  {supervisor?.name || 'Assigned Supervisor'}
                </span>
                {supervisor?.email && (
                  <span className="text-muted-foreground text-xs">({supervisor.email})</span>
                )}
              </div>
            </div>

            <div className="sm:text-right flex-shrink-0">
              {/* Standardized Submitted Status Badge */}
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 text-sm px-3 py-1 mb-2 font-medium">
                Submitted
              </Badge>
              {submittedDate && (
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(submittedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Score Summary Card */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-3">Score Summary</h4>
            <Card className="bg-muted/40 border border-border">
              <CardContent className="p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {totalScore !== null ? `${totalScore}/70` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Total Score</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      {percentageScore ? `${percentageScore}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Percentage</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {finalGrade !== null ? finalGrade.toFixed(2) : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Final Grade</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rubric Criteria Scores Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-foreground">Rubric Criteria Scores</h4>
              <span className="text-xs text-muted-foreground">Evaluated on a 1–10 point scale</span>
            </div>
            <Card className="bg-card border border-border">
              <CardContent className="p-4 space-y-3">
                {criterionScores.length > 0 ? (
                  criterionScores.map((score: any, idx: number) => {
                    const rating = getScoreRating(score.score);
                    const description = getCriterionDescription(
                      score.criterion_code,
                      score.criterion_name,
                      score.score
                    );
                    const title = formatCriterionTitle(score.criterion_code, score.criterion_name);

                    return (
                      <div
                        key={`${score.criterion_code}-${idx}`}
                        className="p-3.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">
                              {title}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn('text-xs font-semibold px-2 py-0.5', rating.badgeClass)}
                            >
                              {rating.label}
                            </Badge>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                              {score.score}/10
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed italic bg-background p-2.5 rounded border border-border/50">
                          &ldquo;{description}&rdquo;
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No rubric scores recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Attendance & Punctuality */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Attendance &amp; Punctuality</h4>
            <Card className="bg-card border border-border">
              <CardContent className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                  <Badge variant="outline" className="capitalize font-medium">
                    {evaluation.attendance || 'Regular'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Punctuality</p>
                  <Badge variant="outline" className="capitalize font-medium">
                    {evaluation.punctuality || 'Regular'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Supervisor Comments */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Supervisor&apos;s Comment</h4>
            <Card className="bg-card border border-border">
              <CardContent className="p-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {evaluation.supervisor_comments || 'No comments provided.'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Integrated Evaluation Timeline / History */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Evaluation Timeline</h4>
            <Card className="bg-card border border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Submitted</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(submittedDate).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {evaluation.updated_at && evaluation.updated_at !== evaluation.created_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Last Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(evaluation.updated_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
