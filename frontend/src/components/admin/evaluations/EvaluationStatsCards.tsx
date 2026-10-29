/**
 * Evaluation Stats Cards Component
 * 
 * Displays overview metrics for evaluations (total, pending, approved, quality score)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QualityMetrics, EvaluationWithRelations } from '@/types/api';
import { FileText, Clock, CheckCircle, Award } from 'lucide-react';
import { convertScoreToGrade } from './gradeUtils';

interface EvaluationStatsCardsProps {
  metrics: QualityMetrics | null;
  evaluations?: EvaluationWithRelations[];
  loading?: boolean;
}

export function EvaluationStatsCards({ metrics, evaluations, loading }: EvaluationStatsCardsProps) {
  const averageGrade = React.useMemo(() => {
    if (!evaluations || evaluations.length === 0) return 'N/A';
    const graded = evaluations.filter((e) => {
      const g = e.total_score ? convertScoreToGrade(e.total_score) : e.final_grade;
      return typeof g === 'number' && g > 0;
    });
    if (graded.length === 0) return 'N/A';
    const sum = graded.reduce((acc, curr) => {
      const g = curr.total_score ? convertScoreToGrade(curr.total_score) : (curr.final_grade || 0);
      return acc + g;
    }, 0);
    return (sum / graded.length).toFixed(2);
  }, [evaluations]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Standardized evaluation metrics
  const stats = [
    {
      title: 'Total Evaluations',
      value: metrics.total || 0,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Submitted',
      value: metrics.submitted || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
    },
    {
      title: 'On Draft',
      value: metrics.on_draft || 0,
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      title: 'Average Final Grade',
      value: averageGrade,
      icon: Award,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
