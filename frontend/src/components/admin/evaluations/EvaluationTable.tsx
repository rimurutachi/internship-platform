/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Evaluation Table Component
 * 
 * Data table for displaying evaluations with actions
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvaluationWithRelations } from '@/types/api';
import { Eye, XCircle, RefreshCw } from 'lucide-react';
import { convertScoreToGrade } from './gradeUtils';

interface EvaluationTableProps {
  evaluations: EvaluationWithRelations[];
  loading?: boolean;
  onView: (evaluation: EvaluationWithRelations) => void;
  onApprove: (evaluation: EvaluationWithRelations) => void;
  onReject: (evaluation: EvaluationWithRelations) => void;
  onReprocess: (evaluationId: string) => void;
}

export function EvaluationTable({
  evaluations,
  loading,
  onView,
  onApprove,
  onReject,
  onReprocess,
}: EvaluationTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      submitted: 'default',
      processed: 'secondary',
      approved: 'default',
    };
    
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      submitted: 'bg-blue-500',
      processed: 'bg-yellow-500',
      approved: 'bg-green-500',
    };

    return (
      <Badge variant={variants[status] || 'default'} className={colors[status]}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </Badge>
    );
  };

  const getTypeBadge = (evaluationType?: string, weekNumber?: number | null, period?: string | null) => {
    const colors: Record<string, string> = {
      weekly: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      midterm: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      final: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };

    const displayText = period || evaluationType?.toUpperCase() || 'FINAL';
    const colorClass = colors[evaluationType || 'final'] || colors.final;

    return (
      <Badge variant="outline" className={colorClass}>
        {displayText}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 bg-muted rounded w-32 animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-muted rounded w-24 animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-muted rounded w-32 animate-pulse"></div></TableCell>
                <TableCell><div className="h-6 bg-muted rounded w-20 animate-pulse"></div></TableCell>
                <TableCell><div className="h-4 bg-muted rounded w-12 animate-pulse"></div></TableCell>
                <TableCell><div className="h-8 bg-muted rounded w-24 animate-pulse ml-auto"></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No evaluations found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Supervisor</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((evaluation) => (
            <TableRow key={evaluation.id}>
              <TableCell className="font-medium">
                {evaluation.internship?.student?.name}
              </TableCell>
              <TableCell>
                {evaluation.internship?.company?.name || 'N/A'}
              </TableCell>
              <TableCell>
                {evaluation.internship?.supervisor?.name}
              </TableCell>
              <TableCell>
                {getTypeBadge(evaluation.evaluation_type, evaluation.week_number, evaluation.evaluation_period)}
              </TableCell>
              <TableCell>
                {getStatusBadge(evaluation.status)}
              </TableCell>
              <TableCell>
                {evaluation.final_grade 
                  ? `${evaluation.final_grade.toFixed(1)}`
                  : evaluation.total_score
                    ? `${convertScoreToGrade(evaluation.total_score).toFixed(2)}*`
                    : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(evaluation)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {/* Archive button for approved evaluations */}
                  {evaluation.status === 'approved' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(evaluation)}
                      className="text-destructive hover:text-destructive"
                      title="Archive evaluation"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {evaluation.status === 'processed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReprocess(evaluation.id)}
                      className="text-warning hover:text-warning"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
