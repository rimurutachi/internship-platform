import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListCheck } from "lucide-react";
import Link from "next/link";

interface TasksCardProps {
  pendingCount?: number;
  completedCount?: number;
}

export const TasksCard = ({ pendingCount = 0, completedCount = 0 }: TasksCardProps) => {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-base text-muted-foreground">
            <div>Pending: <span className="font-semibold text-foreground">{pendingCount}</span></div>
            <div>Completed: <span className="font-semibold text-foreground">{completedCount}</span></div>
          </div>
          <ListCheck className="w-10 h-10 text-primary" />
        </div>
        <Link href="/dashboard/student/tasks" className="block w-full">
          <Button className="w-full bg-background border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold py-3 rounded-lg transition-colors">
            Open Task Lists
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
