import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Calendar, MapPin, TrendingUp } from "lucide-react";
import type { StudentInternship, ProgressMetrics } from "@/types/student";

interface CurrentInternshipCardProps {
  internship: StudentInternship | null;
  progress: ProgressMetrics | null;
}

export const CurrentInternshipCard = ({ internship, progress }: CurrentInternshipCardProps) => {
  if (!internship) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Current Internship</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No active internship found.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">Current Internship</CardTitle>
          <Badge className="bg-[#4CAF50] text-white border-0 text-xs px-3 py-1">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {internship.position}
            </h3>
            <div className="flex items-center space-x-2 text-gray-600 mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-base">{internship.company?.name || 'ABC Company'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {formatDate(internship.start_date)} - {formatDate(internship.end_date)}
              </span>
            </div>
          </div>
          
          {progress && (
            <div className="text-right border-2 border-gray-300 rounded-xl p-4 min-w-[140px]">
              <div className="text-sm text-gray-600 mb-1">Overall Progress</div>
              <div className="text-3xl font-bold text-[#4CAF50]">{progress.percentage}%</div>
              <Progress value={progress.percentage} className="mt-2 h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};