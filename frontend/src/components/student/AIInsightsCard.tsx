import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle, Calendar } from "lucide-react";

export const AIInsightsCard = () => {
  return (
    <Card className="bg-gradient-to-br from-ai/5 to-ai/10 border-ai/20 hover:shadow-card transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-ai">
          <Brain className="w-5 h-5" />
          <span>AI Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-success mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Performance Trending Up</p>
              <p className="text-xs text-muted-foreground">
                Your technical skills have improved 15% this month
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Feedback Opportunity</p>
              <p className="text-xs text-muted-foreground">
                Consider scheduling 1:1 with supervisor
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-card rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">AI Confidence Score</span>
            <Badge className="bg-ai/10 text-ai border-ai/20">94%</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            High accuracy in performance prediction based on current trajectory
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const RecentMessagesCard = () => {
  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg">Recent Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
          <div>
            <p className="text-sm font-medium text-foreground">Sarah Johnson</p>
            <p className="text-xs text-muted-foreground mb-1">
              Great work on the API documentation...
            </p>
            <p className="text-xs text-muted-foreground">2 hours ago</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
          <div>
            <p className="text-sm font-medium text-foreground">Dr. Martinez</p>
            <p className="text-xs text-muted-foreground mb-1">
              Your mid-term evaluation is ready...
            </p>
            <p className="text-xs text-muted-foreground">1 day ago</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UpcomingDeadlinesCard = () => {
  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-lg">Upcoming Deadlines</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-3 p-2 border rounded border-destructive/20 bg-destructive/5">
          <div className="w-2 h-2 bg-destructive rounded-full"></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Weekly Report Due</p>
            <p className="text-xs text-destructive">Tomorrow, 11:59 PM</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-2 border rounded border-warning/20 bg-warning/5">
          <div className="w-2 h-2 bg-warning rounded-full"></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Team Presentation</p>
            <p className="text-xs text-warning">Friday, 2:00 PM</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};