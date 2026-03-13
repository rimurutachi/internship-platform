/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock } from "lucide-react";
import Link from "next/link";

interface FinalEvaluationCardProps {
  isAvailable: boolean;
  releaseDate?: string; // internship end date
  disabledReason?: string;
}

export const FinalEvaluationCard = ({ isAvailable, releaseDate, disabledReason }: FinalEvaluationCardProps) => {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Final Evaluation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            {isAvailable ? (
              <p className="text-base text-muted-foreground">Your supervisor's final evaluation is available.</p>
            ) : (
              <p className="text-base text-muted-foreground">
                {disabledReason || 'Final evaluation not available yet.'}
                {releaseDate ? ` Available after ${new Date(releaseDate).toLocaleDateString()}.` : ''}
              </p>
            )}
          </div>
          {isAvailable ? <ShieldCheck className="w-6 h-6 text-primary" /> : <Lock className="w-6 h-6 text-muted-foreground" />}
        </div>
        {isAvailable ? (
          <Link href="/dashboard/student/evaluations" className="block w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base">
              View Final Evaluation
            </Button>
          </Link>
        ) : (
          <Button disabled className="w-full py-6 text-base" variant="outline">
            Final Evaluation Unavailable
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
