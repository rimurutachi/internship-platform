/**
 * Custom Hooks for Supervisor Evaluations
 * 
 * React hooks for evaluation API integration with debouncing and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import {
  analyzeDraftEvaluation,
  submitEvaluation,
  getInternshipEvaluations,
  getSupervisorEvaluations,
  DraftAnalysisResult,
  SupervisorEvaluation,
  SubmitEvaluationResponse,
} from '@/lib/api/supervisor-evaluations';

/**
 * Hook for real-time draft evaluation analysis with debouncing
 * 
 * @param feedbackText - The feedback text to analyze
 * @param debounceMs - Debounce delay in milliseconds (default: 500ms)
 * @returns Analysis result, loading state, and error
 */
export function useEvaluationAnalysis(feedbackText: string, debounceMs: number = 500) {
  const [analysis, setAnalysis] = useState<DraftAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset if text is too short
    if (!feedbackText || feedbackText.trim().length < 5) {
      setAnalysis(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Set loading state immediately
    setIsLoading(true);
    setError(null);

    // Debounce the API call
    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await analyzeDraftEvaluation(feedbackText.trim());
        setAnalysis(result);
        setError(null);
      } catch (err) {
        console.error('Draft analysis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze draft');
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [feedbackText, debounceMs]);

  return { analysis, isLoading, error };
}

/**
 * Hook for submitting evaluations with AI processing
 * 
 * @returns Submit function, loading state, error, and result
 */
export function useSubmitEvaluation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitEvaluationResponse | null>(null);

  const submit = useCallback(async (evaluationId: string) => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await submitEvaluation(evaluationId);
      setResult(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit evaluation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return { submit, isSubmitting, error, result, reset };
}

/**
 * Hook for fetching supervisor's evaluations
 * Automatically fetches current user's ID from Supabase auth
 * 
 * @param status - Optional status filter
 * @returns Evaluations, loading state, error, and refetch function
 */
export function useSupervisorEvaluations(
  status?: 'draft' | 'submitted' | 'processed' | 'approved'
) {
  const [evaluations, setEvaluations] = useState<SupervisorEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID from Supabase
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
        }
      } catch (err) {
        console.error('Failed to get current user:', err);
      }
    };
    getCurrentUser();
  }, []);

  const fetchEvaluations = useCallback(async () => {
    // Don't fetch if we don't have user ID yet
    if (!currentUserId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSupervisorEvaluations(currentUserId, status);
      setEvaluations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evaluations';
      setError(errorMessage);
      console.error('Fetch evaluations error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, status]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  return { evaluations, isLoading, error, refetch: fetchEvaluations };
}

/**
 * Hook for fetching internship evaluations
 * 
 * @param internshipId - The internship ID
 * @returns Evaluations, loading state, error, and refetch function
 */
export function useInternshipEvaluations(internshipId: string | null) {
  const [evaluations, setEvaluations] = useState<SupervisorEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = useCallback(async () => {
    if (!internshipId) {
      setEvaluations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getInternshipEvaluations(internshipId);
      setEvaluations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch internship evaluations';
      setError(errorMessage);
      console.error('Fetch internship evaluations error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [internshipId]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  return { evaluations, isLoading, error, refetch: fetchEvaluations };
}
