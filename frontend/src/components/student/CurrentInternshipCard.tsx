import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Calendar, MapPin } from "lucide-react";
import type { StudentInternship, ProgressMetrics } from "@/types/student";

interface CurrentInternshipCardProps {
  internship: StudentInternship | null;
  progress: ProgressMetrics | null;
}

export const CurrentInternshipCard = ({ internship, progress }: CurrentInternshipCardProps) => {
  if (!internship) {
    return (
      <Card className="hover:shadow-card transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Current Internship</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active internship found.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Current Internship</span>
          </CardTitle>
          <Badge className="bg-gradient-ai text-white border-0">
            AI MONITORED
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{internship.company?.name || 'Company Name'}</h3>
          <p className="text-lg text-muted-foreground">{internship.position}</p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(internship.start_date)} - {formatDate(internship.end_date)}</span>
          </div>
          {internship.company?.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{internship.company.location}</span>
            </div>
          )}
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">{progress.overall_progress}% Complete</span>
            </div>
            <Progress value={progress.overall_progress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              {progress.weeks_remaining > 0 
                ? `${progress.weeks_remaining} weeks remaining` 
                : progress.time_remaining_days > 0
                ? `${progress.time_remaining_days} days remaining`
                : 'Internship ending soon'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};