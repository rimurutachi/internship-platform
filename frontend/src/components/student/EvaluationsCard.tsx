import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, Clock } from "lucide-react";

export const EvaluationsCard = () => {
  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-success" />
          <span>Recent Evaluations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-lg bg-success/5 border-success/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground">Mid-term Evaluation</h4>
            <Badge className="bg-gradient-ai text-white border-0">
              AI PROCESSED
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 mb-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-success">A-</div>
              <div className="text-xs text-muted-foreground">Overall Grade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-ai">94%</div>
              <div className="text-xs text-muted-foreground">AI Confidence</div>
            </div>
            <div className="text-center">
              <div className="flex items-center text-warning">
                <Star className="w-4 h-4 mr-1" />
                <span className="font-bold">4.7</span>
              </div>
              <div className="text-xs text-muted-foreground">Supervisor Rating</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            &ldquo;Excellent technical skills and proactive communication. Shows great initiative in problem-solving...&rdquo;
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              <span>Evaluated 2 days ago</span>
            </div>
            <Button variant="link" size="sm" className="h-auto p-0">
              View Details
            </Button>
          </div>
        </div>

        <Button variant="outline" className="w-full">
          View All Evaluations
        </Button>
      </CardContent>
    </Card>
  );
};