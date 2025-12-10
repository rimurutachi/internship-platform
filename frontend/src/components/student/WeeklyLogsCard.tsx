import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

interface WeeklyLogsCardProps {
  logsCount?: number;
}

export const WeeklyLogsCard = ({ logsCount = 0 }: WeeklyLogsCardProps) => {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Weekly Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-6">
          <div className="text-5xl font-bold text-gray-900 mb-2">{logsCount}</div>
          <p className="text-base text-gray-600">logs submitted</p>
        </div>
        
        <Button 
          className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold py-6 text-base"
          asChild
        >
          <Link href="/dashboard/student/weekly-reports">
            Add new log
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
