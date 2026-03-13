'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/**
 * InternshipProgressCard Component
 * 
 * Displays internship hours progress with:
 * - Progress bar
 * - Hours worked / Required hours
 * - Remaining hours
 * - Projected end date
 * - Status badge
 */

import { useEffect, useState } from 'react';
import { Clock, Calendar, Target, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { hoursApi } from '@/lib/api/hours';
import type { InternshipHoursSummary } from '@/types/hours';
import { toProgressDisplayData, formatHours, formatProjectedEndDate } from '@/types/hours';

interface InternshipProgressCardProps {
  internshipId: string;
  showWeeklyBreakdown?: boolean;
  compact?: boolean;
  className?: string;
  // Optional: pass pre-fetched data to avoid extra API call
  initialData?: InternshipHoursSummary;
}

export function InternshipProgressCard({
  internshipId,
  showWeeklyBreakdown = false,
  compact = false,
  className = '',
  initialData,
}: InternshipProgressCardProps) {
  const [loading, setLoading] = useState(!initialData);
  const [summary, setSummary] = useState<InternshipHoursSummary | null>(initialData || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setSummary(initialData);
      return;
    }

    const fetchHours = async () => {
      try {
        setLoading(true);
        const result = await hoursApi.getInternshipHoursSummary(internshipId);
        
        if (result.success && result.data) {
          setSummary(result.data);
        } else {
          setError(result.error || 'Failed to load progress');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHours();
  }, [internshipId, initialData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading progress...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card className={className}>
        <CardContent className="py-6 text-center text-muted-foreground">
          {error || 'Unable to load progress data'}
        </CardContent>
      </Card>
    );
  }

  const display = toProgressDisplayData(summary);

  // Compact version for list views
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex-1">
          <Progress value={display.percentage} className="h-2" />
        </div>
        <span className="text-sm font-medium min-w-[60px] text-right">
          {display.percentage.toFixed(1)}%
        </span>
        <Badge variant={display.isCompleted ? 'default' : 'secondary'} className="min-w-[80px] justify-center">
          {display.hoursWorked}/{display.hoursRequired}h
        </Badge>
      </div>
    );
  }

  // Full card version
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Internship Progress
          </CardTitle>
          <Badge 
            variant={display.isCompleted ? 'default' : 'outline'}
            className={
              display.statusColor === 'green' ? 'bg-green-500 text-white' :
              display.statusColor === 'yellow' ? 'bg-yellow-500 text-white' :
              display.statusColor === 'blue' ? 'bg-blue-500 text-white' :
              ''
            }
          >
            {display.isCompleted ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </>
            ) : (
              `${display.percentage.toFixed(1)}%`
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={display.percentage} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{display.hoursWorked} hours worked</span>
            <span>{display.hoursRequired} hours required</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Hours Remaining */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="font-semibold">
                {display.isCompleted ? 'Complete!' : formatHours(display.hoursRemaining)}
              </p>
            </div>
          </div>

          {/* Weeks Completed */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Weeks</p>
              <p className="font-semibold">
                {display.weeksCompleted} completed
              </p>
            </div>
          </div>

          {/* Projected End Date */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 col-span-2">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Projected End Date</p>
              <p className="font-semibold">
                {display.isCompleted 
                  ? 'Internship Complete' 
                  : formatProjectedEndDate(display.projectedEndDate)
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact inline progress display for tables/lists
 */
export function InternshipProgressInline({
  summary,
  showHours = true,
}: {
  summary: InternshipHoursSummary;
  showHours?: boolean;
}) {
  const display = toProgressDisplayData(summary);

  return (
    <div className="flex items-center gap-2">
      <Progress value={display.percentage} className="h-2 w-20 sm:w-24" />
      <span className="text-xs sm:text-sm font-medium text-muted-foreground min-w-[40px]">
        {display.percentage.toFixed(0)}%
      </span>
      {showHours && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          ({display.hoursWorked}/{display.hoursRequired}h)
        </span>
      )}
    </div>
  );
}

export default InternshipProgressCard;
