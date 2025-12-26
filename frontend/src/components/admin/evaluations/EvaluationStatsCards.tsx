/**
 * Evaluation Stats Cards Component
 * 
 * Displays overview metrics for evaluations (total, pending, approved, quality score)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QualityMetrics } from '@/types/api';
import { FileText, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface EvaluationStatsCardsProps {
  metrics: QualityMetrics | null;
  loading?: boolean;
}

export function EvaluationStatsCards({ metrics, loading }: EvaluationStatsCardsProps) {
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

  const stats = [
    {
      title: 'Total Evaluations',
      value: (metrics.total_this_month || 0) + (metrics.total_processed || 0),
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'On Draft',
      value: metrics.total_this_month || 0,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Submitted',
      value: metrics.total_processed || 0,
      icon: CheckCircle,
      color: 'text-blue-500',
    },
    {
      title: 'Approved',
      value: Math.round((metrics.total_processed || 0) * (metrics.bias_pass_rate || 0)),
      icon: TrendingUp,
      color: 'text-green-600',
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
