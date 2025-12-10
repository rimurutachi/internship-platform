/**
 * Evaluation Progress Summary Component
 * 
 * Shows overview of evaluation completion status
 */

'use client';

import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressSummary {
  weekly: {
    total: number;
    completed: number;
    pending: number;
  };
  midterm: {
    completed: boolean;
    status?: string;
  };
  final: {
    completed: boolean;
    status?: string;
  };
}

interface EvaluationProgressSummaryProps {
  progress: ProgressSummary | null;
  loading?: boolean;
}

export function EvaluationProgressSummary({ progress, loading }: EvaluationProgressSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const weeklyPercentage = progress.weekly.total > 0 
    ? Math.round((progress.weekly.completed / progress.weekly.total) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Weekly Evaluations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-200" />
            </div>
            Weekly Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {progress.weekly.completed}
              </span>
              <span className="text-muted-foreground">/ {progress.weekly.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all" 
                  style={{ width: `${weeklyPercentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{weeklyPercentage}%</span>
            </div>
            {progress.weekly.pending > 0 && (
              <p className="text-xs text-muted-foreground">
                {progress.weekly.pending} pending
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Midterm Evaluation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              {progress.midterm.completed ? (
                <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-200" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-200" />
              )}
            </div>
            Midterm Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {progress.midterm.completed ? (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  Completed
                </span>
              ) : (
                <span className="text-orange-600 dark:text-orange-400">Pending</span>
              )}
            </div>
            {progress.midterm.status && (
              <p className="text-xs text-muted-foreground capitalize">
                Status: {progress.midterm.status}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Mandatory evaluation</p>
          </div>
        </CardContent>
      </Card>

      {/* Final Evaluation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              {progress.final.completed ? (
                <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-200" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-200" />
              )}
            </div>
            Final Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {progress.final.completed ? (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  Completed
                </span>
              ) : (
                <span className="text-orange-600 dark:text-orange-400">Pending</span>
              )}
            </div>
            {progress.final.status && (
              <p className="text-xs text-muted-foreground capitalize">
                Status: {progress.final.status}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Mandatory evaluation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
