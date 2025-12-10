/**
 * Evaluation Timeline Component
 * 
 * Displays student's evaluation progress with weekly, midterm, and final evaluations
 */

'use client';

import React from 'react';
import { CheckCircle, Clock, Circle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EvaluationType } from '@/types/api';

interface TimelineEvaluation {
  id: string;
  evaluation_type: EvaluationType;
  week_number?: number | null;
  evaluation_period?: string | null;
  status: 'draft' | 'submitted' | 'processed' | 'approved';
  rating_overall: number | null;
  due_date?: string | null;
  submitted_at: string | null;
  created_at: string;
}

interface EvaluationTimelineProps {
  evaluations: TimelineEvaluation[];
  loading?: boolean;
}

export function EvaluationTimeline({ evaluations, loading }: EvaluationTimelineProps) {
  const getStatusIcon = (status: string, dueDate?: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === 'draft';
    
    if (status === 'approved' || status === 'processed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (status === 'submitted') {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    if (isOverdue) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'weekly': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'midterm': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'final': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string, dueDate?: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === 'draft';
    
    if (isOverdue) return 'Overdue';
    if (status === 'approved') return 'Completed';
    if (status === 'processed') return 'Completed';
    if (status === 'submitted') return 'Under Review';
    if (status === 'draft') return 'Pending';
    return status;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Group evaluations by type
  const weeklyEvals = evaluations.filter(e => e.evaluation_type === 'weekly').sort((a, b) => (a.week_number || 0) - (b.week_number || 0));
  const midtermEval = evaluations.find(e => e.evaluation_type === 'midterm');
  const finalEval = evaluations.find(e => e.evaluation_type === 'final');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Timeline</CardTitle>
          <CardDescription>Loading your evaluation progress...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Timeline</CardTitle>
          <CardDescription>Track your internship evaluation progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No evaluations yet</p>
            <p className="text-sm mt-1">Your supervisor will create evaluations as you progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Timeline</CardTitle>
        <CardDescription>Track your internship evaluation progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Weekly Evaluations */}
          {weeklyEvals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Weekly Check-ins</h3>
              <div className="space-y-3">
                {weeklyEvals.map((evaluation, index) => (
                  <div key={evaluation.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="mt-0.5">
                      {getStatusIcon(evaluation.status, evaluation.due_date)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={getTypeColor(evaluation.evaluation_type)}>
                          {evaluation.evaluation_period || `Week ${evaluation.week_number}`}
                        </Badge>
                        <span className="text-sm font-medium">
                          {getStatusText(evaluation.status, evaluation.due_date)}
                        </span>
                      </div>
                      {evaluation.rating_overall && (
                        <p className="text-sm text-muted-foreground">
                          Rating: {evaluation.rating_overall}/10
                        </p>
                      )}
                      {evaluation.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {formatDate(evaluation.due_date)}
                        </p>
                      )}
                      {evaluation.submitted_at && (
                        <p className="text-xs text-muted-foreground">
                          Submitted: {formatDate(evaluation.submitted_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Midterm Evaluation */}
          {midtermEval && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Midterm Review</h3>
              <div className="flex items-start gap-4 p-4 border-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="mt-0.5">
                  {getStatusIcon(midtermEval.status, midtermEval.due_date)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className={getTypeColor(midtermEval.evaluation_type)}>
                      {midtermEval.evaluation_period || 'Midterm'}
                    </Badge>
                    <span className="text-sm font-medium">
                      {getStatusText(midtermEval.status, midtermEval.due_date)}
                    </span>
                    <Badge variant="secondary" className="text-xs">Mandatory</Badge>
                  </div>
                  {midtermEval.rating_overall && (
                    <p className="text-sm text-muted-foreground">
                      Rating: {midtermEval.rating_overall}/10
                    </p>
                  )}
                  {midtermEval.due_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {formatDate(midtermEval.due_date)}
                    </p>
                  )}
                  {midtermEval.submitted_at && (
                    <p className="text-xs text-muted-foreground">
                      Submitted: {formatDate(midtermEval.submitted_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Final Evaluation */}
          {finalEval && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Final Assessment</h3>
              <div className="flex items-start gap-4 p-4 border-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="mt-0.5">
                  {getStatusIcon(finalEval.status, finalEval.due_date)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className={getTypeColor(finalEval.evaluation_type)}>
                      {finalEval.evaluation_period || 'Final'}
                    </Badge>
                    <span className="text-sm font-medium">
                      {getStatusText(finalEval.status, finalEval.due_date)}
                    </span>
                    <Badge variant="secondary" className="text-xs">Mandatory</Badge>
                  </div>
                  {finalEval.rating_overall && (
                    <p className="text-sm text-muted-foreground">
                      Rating: {finalEval.rating_overall}/10
                    </p>
                  )}
                  {finalEval.due_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {formatDate(finalEval.due_date)}
                    </p>
                  )}
                  {finalEval.submitted_at && (
                    <p className="text-xs text-muted-foreground">
                      Submitted: {formatDate(finalEval.submitted_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
