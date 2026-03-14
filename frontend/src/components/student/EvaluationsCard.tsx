/* eslint-disable @typescript-eslint/no-unused-vars */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, Clock } from "lucide-react";
import type { StudentEvaluation } from "@/types/student";
import Link from "next/link";

interface EvaluationsCardProps {
  evaluations: StudentEvaluation[];
}

export const EvaluationsCard = ({ evaluations }: EvaluationsCardProps) => {
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const evalDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'text-success';
    if (status === 'processed') return 'text-primary';
    if (status === 'submitted') return 'text-warning';
    return 'text-muted-foreground';
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
  };

  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-success" />
          <span>Recent Evaluations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {evaluations.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No evaluations yet.</p>
        ) : (
          evaluations.slice(0, 1).map((evaluation) => (
            <div key={evaluation.id} className="p-4 border rounded-lg bg-success/5 border-success/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">
                  {evaluation.status === 'approved' ? 'Approved' : 
                   evaluation.status === 'processed' ? 'Processed' : 
                   evaluation.status === 'submitted' ? 'Submitted' : 'Draft'} Evaluation
                </h4>
                <Badge className="bg-gradient-ai text-white border-0">
                  AI PROCESSED
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 mb-3">
                {evaluation.rating_overall && (
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getStatusColor(evaluation.status)}`}>
                      {evaluation.rating_overall.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Overall Rating</div>
                  </div>
                )}
                {evaluation.rating_technical && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {evaluation.rating_technical.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Technical</div>
                  </div>
                )}
                {evaluation.rating_communication && (
                  <div className="text-center">
                    <div className="flex items-center text-warning">
                      <Star className="w-4 h-4 mr-1" />
                      <span className="font-bold">{evaluation.rating_communication.toFixed(1)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Communication</div>
                  </div>
                )}
              </div>

              {evaluation.feedback_text && (
                <p className="text-sm text-muted-foreground mb-3">
                  &ldquo;{evaluation.feedback_text.substring(0, 100)}
                  {evaluation.feedback_text.length > 100 ? '...' : ''}&rdquo;
                </p>
              )}

              {evaluation.sentiment_scores && (
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs text-muted-foreground">Sentiment:</span>
                  <Badge variant="outline" className="text-xs bg-success/10">
                    Positive {Math.round(evaluation.sentiment_scores.positive * 100)}%
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>Evaluated {getTimeAgo(evaluation.submitted_at || evaluation.created_at)}</span>
                </div>
                <Link href={`/dashboard/student/evaluations/${evaluation.id}`}>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}

        <Link href="/dashboard/student/evaluations">
          <Button variant="outline" className="w-full">
            View All Evaluations
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};