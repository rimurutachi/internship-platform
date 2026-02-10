"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { studentAPI } from "@/lib/api/student";

interface TasksCardProps {
  internshipId?: string;
}

export const TasksCard = ({ internshipId }: TasksCardProps) => {
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await studentAPI.getTaskStats(internshipId);
        if (response.success && response.data) {
          // Pending includes both 'pending' and 'in_progress' for the widget
          setPendingCount((response.data.pending || 0) + (response.data.in_progress || 0));
          setCompletedCount(response.data.completed || 0);
        }
      } catch (error) {
        console.error('Failed to fetch task stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [internshipId]);

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <div className="text-base text-muted-foreground">
              <div>Pending: <span className="font-semibold text-foreground">{pendingCount}</span></div>
              <div>Completed: <span className="font-semibold text-foreground">{completedCount}</span></div>
            </div>
          )}
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
