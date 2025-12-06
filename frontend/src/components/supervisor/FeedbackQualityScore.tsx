/**
 * Feedback Quality Score Component
 * Displays real-time quality assessment with improvement suggestions
 * Phase 1 Enhancement
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, XCircle, FileText, TrendingUp } from 'lucide-react';

interface FeedbackQuality {
  suggestions: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    current?: number;
    target?: number;
    examples?: string[];
    tip?: string;
    prompt?: string;
  }>;
  strengths: string[];
  quality_score: number;
  readiness: boolean;
  metrics: {
    word_count: number;
    sentence_count: number;
    skill_count: number;
    sentiment_balance: string;
    has_specific_examples: boolean;
  };
}

interface FeedbackQualityScoreProps {
  quality: FeedbackQuality | null;
}

export function FeedbackQualityScore({ quality }: FeedbackQualityScoreProps) {
  if (!quality) {
    return null;
  }

  const { quality_score, readiness, suggestions, strengths, metrics } = quality;

  // Get quality color and label
  const getQualityStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { label: 'Needs Work', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const status = getQualityStatus(quality_score);

  // Get severity icon and color
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'high':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' };
      case 'medium':
        return { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' };
      default:
        return { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' };
    }
  };

  return (
    <Card className={`border ${status.border} ${status.bg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Feedback Quality
          </CardTitle>
          <Badge 
            variant={readiness ? 'default' : 'secondary'}
            className={readiness ? 'bg-green-600' : ''}
          >
            {readiness ? '✓ Ready' : 'In Progress'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality Score Display */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-gray-600">Quality Score</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-bold ${status.color}`}>
                {Math.round(quality_score)}
              </span>
              <span className="text-lg text-gray-500">/100</span>
            </div>
          </div>
          <Progress value={quality_score} className="h-2 mb-2" />
          <p className={`text-xs font-medium ${status.color}`}>
            {status.label} Quality
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
          <div className="bg-white rounded p-2 border text-xs">
            <p className="text-gray-500 mb-1">Words</p>
            <p className="font-bold text-lg">{metrics.word_count}</p>
          </div>
          <div className="bg-white rounded p-2 border text-xs">
            <p className="text-gray-500 mb-1">Skills</p>
            <p className="font-bold text-lg">{metrics.skill_count}</p>
          </div>
          <div className="bg-white rounded p-2 border text-xs">
            <p className="text-gray-500 mb-1">Sentences</p>
            <p className="font-bold text-lg">{metrics.sentence_count}</p>
          </div>
          <div className="bg-white rounded p-2 border text-xs">
            <p className="text-gray-500 mb-1">Tone</p>
            <p className="font-bold text-sm capitalize">{metrics.sentiment_balance}</p>
          </div>
        </div>

        {/* Strengths */}
        {strengths && strengths.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 uppercase flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Strengths
            </p>
            <div className="space-y-1">
              {strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm bg-green-50 rounded p-2 border border-green-200">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span className="flex-1 text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 uppercase flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Suggestions ({suggestions.length})
            </p>
            <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, idx) => {
                const severityStyle = getSeverityStyle(suggestion.severity);
                const SeverityIcon = severityStyle.icon;
                
                return (
                  <div key={idx} className={`rounded p-3 border ${severityStyle.bg}`}>
                    <div className="flex gap-2 mb-2">
                      <SeverityIcon className={`h-4 w-4 ${severityStyle.color} mt-0.5`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{suggestion.message}</p>
                        {suggestion.current !== undefined && suggestion.target !== undefined && (
                          <p className="text-xs text-gray-600 mt-1">
                            Current: {suggestion.current} | Target: {suggestion.target}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {suggestion.tip && (
                      <Alert className="mt-2 py-1 text-xs bg-white/50">
                        <AlertDescription>{suggestion.tip}</AlertDescription>
                      </Alert>
                    )}
                    
                    {suggestion.examples && suggestion.examples.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-600">Examples:</p>
                        {suggestion.examples.map((example, exIdx) => (
                          <p key={exIdx} className="text-xs text-gray-700 ml-2">
                            • {example}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ready Status */}
        {readiness ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              Your evaluation meets quality standards and is ready to submit!
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              Address the suggestions above to improve evaluation quality.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
