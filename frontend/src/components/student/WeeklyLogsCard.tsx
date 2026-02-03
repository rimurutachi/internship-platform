import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

interface WeeklyLogsCardProps {
  logsCount?: number;
}

export const WeeklyLogsCard = ({ logsCount = 0 }: WeeklyLogsCardProps) => {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Weekly Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-6">
          <div className="text-5xl font-bold text-foreground mb-2">{logsCount}</div>
          <p className="text-base text-muted-foreground">logs submitted</p>
        </div>
        
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
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
