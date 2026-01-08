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
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-base text-gray-600">
            <div>Pending: <span className="font-semibold text-gray-900">{pendingCount}</span></div>
            <div>Completed: <span className="font-semibold text-gray-900">{completedCount}</span></div>
          </div>
          <ListCheck className="w-10 h-10 text-[#4CAF50]" />
        </div>
        <Link href="/dashboard/student/tasks" className="block w-full">
          <Button className="w-full bg-white border-2 border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white font-semibold py-3 rounded-lg transition-colors">
            Open Task Lists
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
