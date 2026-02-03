import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";

interface ProgressAnalyticsCardProps {
  progress?: number;
}

export const ProgressAnalyticsCard = ({ progress = 0 }: ProgressAnalyticsCardProps) => {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Progress & Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <BarChart3 className="w-16 h-16 mx-auto text-[#4CAF50] mb-4" />
          <p className="text-base text-gray-600">
            Track your internship progress and view detailed analytics
          </p>
        </div>
        
        <Link 
          href="/dashboard/student/evaluations"
          className="block w-full text-center bg-white border-2 border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white font-semibold py-3 rounded-lg transition-colors"
        >
          View Analytics
        </Link>
      </CardContent>
    </Card>
  );
};
