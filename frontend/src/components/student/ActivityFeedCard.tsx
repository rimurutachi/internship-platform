import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MessageSquare, FileText, AlertCircle } from "lucide-react";

interface Activity {
  type: 'approval' | 'review' | 'document' | 'reminder';
  title: string;
  time: string;
}

interface ActivityFeedCardProps {
  activities?: Activity[];
}

const defaultActivities: Activity[] = [
  { type: "approval", title: 'Document "Waiver" Approved', time: "2 hours ago" },
  { type: "review", title: "Supervisor reviewed your Weekly Report", time: "5 hours ago" },
  { type: "document", title: 'Document "MOA" Approved', time: "1 day ago" },
  { type: "reminder", title: "Advisor sent a reminder", time: "1 day ago" },
];

export const ActivityFeedCard = ({ activities = defaultActivities }: ActivityFeedCardProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'approval':
      case 'document':
        return <CheckCircle className="w-5 h-5 text-[#4CAF50]" />;
      case 'review':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'reminder':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="mt-1">{getIcon(activity.type)}</div>
              <div className="flex-1">
                <p className="text-base text-gray-900 font-medium">{activity.title}</p>
                <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
