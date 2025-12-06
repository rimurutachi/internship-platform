/**
 * LLT Rating Guidance Component
 * Displays AI-suggested rating range with explanation
 * Phase 1 Enhancement
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface LLTGuidance {
  suggested_rating: number;
  range: {
    min: number;
    max: number;
  };
  confidence: number;
  breakdown: {
    sentiment_contribution: number;
    skill_contribution: number;
    text_quality_contribution: number;
    consistency_contribution: number;
  };
  explanation: string;
  guidance: Array<{
    type: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

interface LLTRatingGuidanceProps {
  guidance: LLTGuidance | null;
  currentRating?: number;
}

export function LLTRatingGuidance({ guidance, currentRating }: LLTRatingGuidanceProps) {
  if (!guidance) {
    return null;
  }

  const { suggested_rating, range, confidence, breakdown, explanation, guidance: tips } = guidance;

  // Determine if current rating is within suggested range
  const isInRange = currentRating 
    ? currentRating >= range.min && currentRating <= range.max
    : true;

  // Get confidence color
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600';
    if (conf >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            AI Rating Guidance
          </CardTitle>
          <Badge variant="outline" className={getConfidenceColor(confidence)}>
            {Math.round(confidence * 100)}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested Rating Display */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-gray-600">Suggested Rating</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-blue-600">
                {suggested_rating.toFixed(1)}
              </span>
              <span className="text-lg text-gray-500">/10</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Recommended range: {range.min.toFixed(1)} - {range.max.toFixed(1)}
          </div>
          <Progress value={suggested_rating * 10} className="h-2" />
        </div>

        {/* Current Rating Comparison */}
        {currentRating && (
          <Alert variant={isInRange ? 'default' : 'destructive'} className="py-2">
            <AlertDescription className="text-sm">
              {isInRange ? (
                <span className="flex items-center gap-1">
                  ✓ Your rating ({currentRating}/10) is within the suggested range
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  ⚠ Your rating ({currentRating}/10) is outside the suggested range
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Explanation */}
        <div className="text-sm text-gray-700 bg-white rounded p-3 border">
          <p className="font-medium mb-1">Analysis:</p>
          <p>{explanation}</p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 uppercase">Rating Factors</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(breakdown).map(([key, value]) => {
              const label = key.replace(/_/g, ' ').replace('contribution', '').trim();
              const percentage = (value / suggested_rating) * 100;
              return (
                <div key={key} className="bg-white rounded p-2 border text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600 capitalize">{label}</span>
                    <span className="font-medium">{value.toFixed(1)}</span>
                  </div>
                  <Progress value={percentage} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Guidance Tips */}
        {tips && tips.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 uppercase">Suggestions</p>
            <div className="space-y-2">
              {tips.map((tip, idx) => (
                <div key={idx} className="flex gap-2 text-sm bg-white rounded p-2 border">
                  {getPriorityIcon(tip.priority)}
                  <span className="flex-1">{tip.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
