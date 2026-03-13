import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Calendar, Clock, Target, TrendingUp, Loader2 } from "lucide-react";
import type { StudentInternship, ProgressMetrics } from "@/types/student";
import { hoursApi } from "@/lib/api/hours";
import type { InternshipHoursSummary } from "@/types/hours";

interface CurrentInternshipCardProps {
  internship: StudentInternship | null;
  progress: ProgressMetrics | null;
}

export const CurrentInternshipCard = ({ internship, progress }: CurrentInternshipCardProps) => {
  const [hoursSummary, setHoursSummary] = useState<InternshipHoursSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (internship?.id) {
      fetchHoursData(internship.id);
    }
  }, [internship?.id]);

  const fetchHoursData = async (internshipId: string) => {
    try {
      setLoading(true);
      const result = await hoursApi.getInternshipHoursSummary(internshipId);
      if (result.success && result.data) {
        setHoursSummary(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch hours data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!internship) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Current Internship</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active internship found.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground">Current Internship</CardTitle>
          <Badge className="bg-primary text-white border-0 text-xs px-3 py-1">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Internship Info */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {internship.position}
          </h3>
          <div className="flex items-center space-x-2 text-muted-foreground mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">{internship.company?.name || 'Company'}</span>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Started {formatDate(internship.start_date)}</span>
          </div>
        </div>

        {/* Hours Progress Section */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : hoursSummary ? (
          <div className="space-y-4 pt-2 border-t">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">
                    {hoursSummary.total_hours_worked} / {hoursSummary.required_hours}h
                  </span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {hoursSummary.progress_percentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={hoursSummary.progress_percentage} className="h-3" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                </div>
                <p className="text-lg font-bold text-foreground">{hoursSummary.total_hours_worked}</p>
                <p className="text-xs text-muted-foreground">Worked</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center text-muted-foreground mb-1">
                  <Target className="w-3 h-3" />
                </div>
                <p className="text-lg font-bold text-foreground">{hoursSummary.remaining_hours}</p>
                <p className="text-xs text-muted-foreground">Left</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center text-muted-foreground mb-1">
                  <Calendar className="w-3 h-3" />
                </div>
                <p className="text-lg font-bold text-foreground">{hoursSummary.days_reported}</p>
                <p className="text-xs text-muted-foreground">Days</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center text-muted-foreground mb-1">
                  <Calendar className="w-3 h-3" />
                </div>
                <p className="text-sm font-bold text-foreground">
                  {hoursSummary.projected_end_date 
                    ? new Date(hoursSummary.projected_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'TBD'
                  }
                </p>
                <p className="text-xs text-muted-foreground">End</p>
              </div>
            </div>

            {/* Completion Status */}
            {hoursSummary.is_completed && (
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-center">
                <p className="font-medium text-sm">✅ Hours completed!</p>
              </div>
            )}
          </div>
        ) : progress ? (
          // Fallback to old progress display
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-1">Overall Progress</div>
            <div className="text-2xl font-bold text-primary">{progress.overall_progress}%</div>
            <Progress value={progress.overall_progress} className="mt-2 h-2" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};