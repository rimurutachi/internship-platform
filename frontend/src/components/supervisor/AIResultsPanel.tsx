/**
 * AI Results Panel Component - Phase 1 Enhanced
 * 
 * Displays real-time AI analysis results for supervisor evaluations
 * Phase 1 Features:
 * - Enhanced sentiment with tone and intensity
 * - LLT rating guidance
 * - Feedback quality scoring
 * - Real-time improvement suggestions
 */

'use client';

import React from 'react';
import { Brain, Sparkles, AlertTriangle, CheckCircle, TrendingUp, Award, Clock, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DraftAnalysisResult } from '@/lib/api/supervisor-evaluations';
import { Skeleton } from '@/components/ui/skeleton';
import { LLTRatingGuidance } from './LLTRatingGuidance';
import { FeedbackQualityScore } from './FeedbackQualityScore';

interface AIResultsPanelProps {
  analysis: DraftAnalysisResult | null;
  isLoading: boolean;
  error?: string | null;
  currentRating?: number; // For LLT comparison
}

/**
 * Get sentiment color based on label (Phase 1 enhanced)
 */
function getSentimentColor(label: string, tone?: string): string {
  // Consider tone for more nuanced colors
  if (tone === 'harsh') return 'text-red-700 bg-red-50 border-red-300';
  if (tone === 'praise') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (tone === 'constructive') return 'text-blue-600 bg-blue-50 border-blue-200';
  if (tone === 'balanced') return 'text-purple-600 bg-purple-50 border-purple-200';
  
  // Fallback to basic sentiment
  switch (label.toLowerCase()) {
    case 'positive':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'negative':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'neutral':
    default:
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  }
}

/**
 * Get sentiment icon based on label
 */
function getSentimentIcon(label: string) {
  switch (label.toLowerCase()) {
    case 'positive':
      return '🟢';
    case 'negative':
      return '🔴';
    case 'neutral':
    default:
      return '🟡';
  }
}

/**
 * Loading skeleton for AI results
 */
function AIResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Score Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-12 w-24 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-12 w-24 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardContent>
        </Card>
      </div>

      {/* Skills Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-24" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Empty state when no analysis available
 */
function AIResultsEmpty() {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6 pb-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Brain className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No AI Analysis Yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start typing feedback to see real-time AI analysis
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Error state for AI analysis
 */
function AIResultsError({ error }: { error: string }) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">AI Analysis Error</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main AI Results Panel Component - Phase 1 Enhanced
 */
export function AIResultsPanel({ analysis, isLoading, error, currentRating }: AIResultsPanelProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold text-foreground">AI Analysis</h3>
          <Badge variant="outline" className="ml-auto">
            <Clock className="w-3 h-3 mr-1" />
            Analyzing...
          </Badge>
        </div>
        <AIResultsSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Analysis</h3>
        </div>
        <AIResultsError error={error} />
      </div>
    );
  }

  // Empty state
  if (!analysis) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Analysis</h3>
        </div>
        <AIResultsEmpty />
      </div>
    );
  }

  // Calculate confidence score percentage
  const confidenceScore = Math.round((analysis.sentiment.score + 1) * 50); // Convert -1 to 1 scale to 0-100
  const sentimentColor = getSentimentColor(analysis.sentiment.label, analysis.sentiment.tone);
  const sentimentIcon = getSentimentIcon(analysis.sentiment.label);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Analysis</h3>
          <Badge variant="outline" className="text-xs">Phase 1</Badge>
        </div>
        {analysis.processing_time_ms && (
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {analysis.processing_time_ms}ms
          </Badge>
        )}
      </div>

      {/* Phase 1: LLT Rating Guidance */}
      {analysis.llt_guidance && (
        <LLTRatingGuidance 
          guidance={analysis.llt_guidance} 
          currentRating={currentRating}
        />
      )}

      {/* Phase 1: Feedback Quality Score */}
      {analysis.feedback_quality && (
        <FeedbackQualityScore quality={analysis.feedback_quality} />
      )}

      {/* Enhanced Sentiment Card */}
      <Card className={sentimentColor}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Sentiment & Tone
            </span>
            {analysis.sentiment.intensity && (
              <Badge variant="outline" className="text-xs capitalize">
                {analysis.sentiment.intensity}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {sentimentIcon} {analysis.sentiment.label}
            </span>
            {analysis.sentiment.tone && (
              <Badge variant="secondary" className="capitalize">
                {analysis.sentiment.tone}
              </Badge>
            )}
          </div>

          {/* Sentiment Breakdown */}
          {analysis.sentiment.breakdown && (
            <div className="space-y-2">
              {Object.entries(analysis.sentiment.breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground capitalize">{key}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {Math.round((value as number) * 100)}%
                    </span>
                  </div>
                  <Progress value={(value as number) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Detected Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
            Skills Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Technical Skills */}
          {analysis.features.technical_skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Technical Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.features.technical_skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 border-blue-200"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {analysis.features.soft_skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Soft Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.features.soft_skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-green-100 text-green-700 border-green-200"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* No skills detected */}
          {analysis.features.technical_skills.length === 0 &&
            analysis.features.soft_skills.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No specific skills detected yet. Continue writing to improve analysis.
              </p>
            )}
        </CardContent>
      </Card>

      {/* AI Assistant Note */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Real-time Phase 1 Analysis Active</p>
              <p className="text-xs text-muted-foreground mt-1">
                Enhanced AI with LLT guidance, quality scoring, and contextual understanding. Your final decision matters most.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
