# Frontend Integration Guide - AI Service for Evaluations

## Overview
This guide helps frontend developers integrate the new AI-powered evaluation endpoints into the supervisor dashboard.

---

## 📋 Implementation Checklist

### Phase 1: Draft Analysis (Real-time Feedback)
- [ ] Add debounced input handler to feedback textarea
- [ ] Create API service method for `POST /api/evaluations/analyze-draft`
- [ ] Display technical skills as tags/chips
- [ ] Display soft skills as tags/chips
- [ ] Show sentiment indicator (positive/neutral/negative)
- [ ] Add loading state during analysis
- [ ] Handle errors gracefully (show toast/alert)

### Phase 2: Enhanced Submission
- [ ] Update submit button handler to use enhanced endpoint
- [ ] Show loading state during AI processing (1-2 seconds)
- [ ] Display AI analysis results after submission
- [ ] Show bias check result (passed/failed)
- [ ] Display confidence score
- [ ] Handle fallback when AI service is unavailable
- [ ] Add WebSocket listener for real-time updates

---

## 🎨 UI Components Needed

### 1. Draft Analysis Display (Real-time)
```tsx
// Component: EvaluationDraftAnalysis.tsx

interface DraftAnalysisProps {
  features: {
    technical_skills: string[];
    soft_skills: string[];
  };
  sentiment: {
    score: number;
    label: string;
  };
  isLoading: boolean;
}

// Visual Elements:
// - Technical Skills: Blue chips/badges
// - Soft Skills: Green chips/badges
// - Sentiment: Color-coded indicator (green=positive, yellow=neutral, red=negative)
// - Loading: Skeleton or spinner
```

### 2. AI Analysis Results Display (Post-submission)
```tsx
// Component: EvaluationAIResults.tsx

interface AIResultsProps {
  ai_analysis: {
    technical_skills: string[];
    soft_skills: string[];
    sentiment_score: number;
    sentiment_label: string;
    bias_check_passed: boolean;
    confidence_score: number;
    processing_time_ms: number;
  };
}

// Visual Elements:
// - Skills breakdown (categories with tags)
// - Sentiment gauge/meter
// - Bias check status (checkmark/warning icon)
// - Confidence score (percentage bar)
// - Processing time (badge)
```

---

## 💻 Code Examples

### API Service (src/lib/api/evaluationService.ts)

```typescript
import { createSupabaseClient } from '@/lib/supabase';

export interface DraftAnalysisResult {
  features: {
    technical_skills: string[];
    soft_skills: string[];
  };
  sentiment: {
    score: number;
    label: string;
    breakdown: Record<string, any>;
  };
  processing_time_ms?: number;
}

export interface AIAnalysisResult {
  technical_skills: string[];
  soft_skills: string[];
  sentiment_score: number;
  sentiment_label: string;
  sentiment_breakdown: any;
  bias_flags: string[];
  bias_check_passed: boolean;
  confidence_score: number;
  processing_time_ms: number;
}

/**
 * Analyze draft evaluation text (real-time)
 */
export async function analyzeDraft(text: string): Promise<DraftAnalysisResult> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/evaluations/analyze-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze draft');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Submit evaluation with AI analysis
 */
export async function submitEvaluation(evaluationId: string): Promise<{
  evaluation: any;
  ai_analysis: AIAnalysisResult | null;
  warning?: string;
}> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`/api/evaluations/${evaluationId}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit evaluation');
  }

  const result = await response.json();
  return result.data;
}
```

---

### React Component Example

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { analyzeDraft, submitEvaluation } from '@/lib/api/evaluationService';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function EvaluationForm({ evaluationId }: { evaluationId?: string }) {
  const [feedbackText, setFeedbackText] = useState('');
  const [draftAnalysis, setDraftAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);

  // Debounce draft analysis
  const debouncedText = useDebounce(feedbackText, 500);

  // Analyze draft on text change
  useEffect(() => {
    if (debouncedText.length >= 5) {
      handleDraftAnalysis(debouncedText);
    } else {
      setDraftAnalysis(null);
    }
  }, [debouncedText]);

  const handleDraftAnalysis = async (text: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeDraft(text);
      setDraftAnalysis(result);
    } catch (error) {
      console.error('Draft analysis error:', error);
      // Optionally show error toast
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!evaluationId) return;
    
    setIsSubmitting(true);
    try {
      const result = await submitEvaluation(evaluationId);
      setAiResults(result.ai_analysis);
      
      // Show success message
      if (result.warning) {
        // Show warning toast: AI analysis unavailable
      } else {
        // Show success toast with AI insights
      }
    } catch (error) {
      console.error('Submit error:', error);
      // Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Textarea */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Evaluation Feedback
        </label>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          className="w-full min-h-[200px] p-3 border rounded-lg"
          placeholder="Describe the student's performance..."
        />
      </div>

      {/* Draft Analysis Display */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing...
        </div>
      )}

      {draftAnalysis && !isAnalyzing && (
        <Alert>
          <AlertDescription>
            <div className="space-y-3">
              {/* Technical Skills */}
              {draftAnalysis.features.technical_skills.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Technical Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {draftAnalysis.features.technical_skills.map((skill: string) => (
                      <Badge key={skill} variant="default" className="bg-blue-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Soft Skills */}
              {draftAnalysis.features.soft_skills.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Soft Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {draftAnalysis.features.soft_skills.map((skill: string) => (
                      <Badge key={skill} variant="default" className="bg-green-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sentiment:</span>
                <Badge 
                  variant="default"
                  className={
                    draftAnalysis.sentiment.label === 'positive' 
                      ? 'bg-green-500' 
                      : draftAnalysis.sentiment.label === 'negative'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }
                >
                  {draftAnalysis.sentiment.label.toUpperCase()}
                </Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || feedbackText.length < 10}
        className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
            Processing with AI...
          </>
        ) : (
          'Submit Evaluation'
        )}
      </button>

      {/* AI Results After Submission */}
      {aiResults && (
        <Alert>
          <AlertDescription>
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                AI Analysis Complete
              </h3>

              {/* Bias Check */}
              <div className="flex items-center gap-2">
                {aiResults.bias_check_passed ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">No bias detected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">Potential bias detected</span>
                  </>
                )}
              </div>

              {/* Confidence Score */}
              <div>
                <span className="text-sm font-medium">Confidence Score:</span>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${aiResults.confidence_score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {(aiResults.confidence_score * 100).toFixed(1)}%
                </span>
              </div>

              {/* Skills Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Technical Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aiResults.technical_skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">Soft Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aiResults.soft_skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

---

## 🎯 UX Considerations

### Loading States
1. **Draft Analysis:** Show subtle spinner next to textarea (< 100ms)
2. **Submission:** Show modal/overlay with "AI Processing..." (1-2s)
3. **Success:** Smooth transition to results view

### Error Handling
1. **AI Service Down:** Show warning but allow submission
2. **Validation Errors:** Highlight field with error message
3. **Network Errors:** Show retry button

### Real-time Updates
1. Listen to WebSocket events for evaluation updates
2. Update UI when AI analysis completes
3. Show notification badge for new insights

---

## 🔧 Configuration

### Environment Variables (frontend/.env)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### API Proxy (if needed)
```javascript
// next.config.ts
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};
```

---

## 📱 Mobile Considerations

- Use responsive grid for skill badges
- Stack analysis panels vertically on small screens
- Ensure textarea is easily editable on mobile
- Use bottom sheet for AI results on mobile

---

## ✅ Testing Checklist

- [ ] Draft analysis triggers after 500ms debounce
- [ ] Skills display correctly as badges
- [ ] Sentiment indicator shows correct color
- [ ] Submit button disabled during processing
- [ ] AI results display after submission
- [ ] Error messages show appropriately
- [ ] Loading states work correctly
- [ ] Works on mobile/tablet viewports

---

## 🚀 Deployment Notes

1. Ensure backend API URL is correct in production
2. Test with production Supabase instance
3. Verify JWT token handling works
4. Test with AI service running in production
5. Monitor performance metrics

---

**Ready for Frontend Implementation! 🎨**
