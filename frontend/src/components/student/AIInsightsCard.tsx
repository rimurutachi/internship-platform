import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle, Lightbulb, Target, Calendar } from "lucide-react";
import type { AIInsights } from "@/types/student";

interface AIInsightsCardProps {
  insights: AIInsights | null;
}

export const AIInsightsCard = ({ insights }: AIInsightsCardProps) => {
  if (!insights) {
    return (
      <Card className="bg-gradient-to-br from-ai/5 to-ai/10 border-ai/20 hover:shadow-card transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-ai">
            <Brain className="w-5 h-5" />
            <span>AI Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No AI insights available yet.</p>
        </CardContent>
      </Card>
    );
  }

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
          {/* Key Strengths */}
          {insights.key_strengths && insights.key_strengths.length > 0 && (
            <div>
              <div className="flex items-center space-x-1 mb-2">
                <Target className="w-4 h-4 text-success" />
                <p className="text-sm font-medium text-foreground">Key Strengths</p>
              </div>
              {insights.key_strengths.slice(0, 2).map((strength, index) => (
                <div key={index} className="flex items-start space-x-2 ml-5">
                  <div className="w-1.5 h-1.5 bg-success rounded-full mt-1.5"></div>
                  <p className="text-xs text-muted-foreground">{strength}</p>
                </div>
              ))}
            </div>
          )}

          {/* Improvement Areas */}
          {insights.growth_areas && insights.growth_areas.length > 0 && (
            <div>
              <div className="flex items-center space-x-1 mb-2">
                <TrendingUp className="w-4 h-4 text-warning" />
                <p className="text-sm font-medium text-foreground">Areas to Improve</p>
              </div>
              {insights.growth_areas.slice(0, 2).map((area, index) => (
                <div key={index} className="flex items-start space-x-2 ml-5">
                  <div className="w-1.5 h-1.5 bg-warning rounded-full mt-1.5"></div>
                  <p className="text-xs text-muted-foreground">{area}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div>
              <div className="flex items-center space-x-1 mb-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Recommendations</p>
              </div>
              {insights.recommendations.slice(0, 1).map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 ml-5">
                  <AlertCircle className="w-3 h-3 text-primary mt-0.5" />
                  <p className="text-xs text-muted-foreground">{recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 bg-card rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">AI Confidence Score</span>
            <Badge className="bg-ai/10 text-ai border-ai/20">
              {Math.round((insights.confidence_score || 0) * 100)}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {insights.performance_trend === 'up' ? 'Performance trending upward' :
             insights.performance_trend === 'stable' ? 'Maintaining consistent performance' :
             insights.performance_trend === 'down' ? 'Consider scheduling 1:1 with supervisor' :
             'Analyzing performance data'}
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

export const UpcomingDeadlinesCard = ({ tasks }: { tasks: Array<{ id: number; title: string; due_date: string; priority: string; status: string }> }) => {
  const getTimeUntil = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffInHours = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours} hours`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return `${diffInDays} days`;
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return { bg: 'bg-destructive/5', border: 'border-destructive/20', dot: 'bg-destructive', text: 'text-destructive' };
    if (priority === 'medium') return { bg: 'bg-warning/5', border: 'border-warning/20', dot: 'bg-warning', text: 'text-warning' };
    return { bg: 'bg-primary/5', border: 'border-primary/20', dot: 'bg-primary', text: 'text-primary' };
  };

  const sortedTasks = [...tasks]
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-lg">Upcoming Deadlines</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
        ) : (
          sortedTasks.map((task) => {
            const colors = getPriorityColor(task.priority);
            return (
              <div key={task.id} className={`flex items-center space-x-3 p-2 border rounded ${colors.border} ${colors.bg}`}>
                <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className={`text-xs ${colors.text}`}>{getTimeUntil(task.due_date)}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};