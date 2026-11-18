/**
 * Analytics Service - AI Trend Analysis Integration
 * 
 * Provides methods to fetch approved evaluations and call AI service
 * for historical trend analysis. Used by admin dashboard and analytics page.
 * 
 * @version 2.0.0
 */

import { createClient } from '@supabase/supabase-js';
import aiService, { 
  EvaluationData,
  TrendAnalysisResponse,
  DashboardInsightsResponse,
  CompanyPerformance,
  UniversityPerformance,
  SkillTrends,
  TrendAnalysisOptions
} from './aiService';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

/**
 * Fetch submitted/approved evaluations with all context needed for AI analysis
 */
export async function fetchApprovedEvaluationsForAnalysis(
  options: {
    limit?: number;
    universityId?: string;
    companyId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}
): Promise<EvaluationData[]> {
  console.log('🔵 [Analytics] Fetching submitted evaluations for AI analysis', options);

  let query = supabase
    .from('evaluations')
    .select(`
      id,
      internship_id,
      supervisor_id,
      advisor_id,
      supervisor_comments,
      total_score,
      final_grade,
      attendance,
      punctuality,
      approved_at,
      submitted_at,
      created_at,
      criterion_scores:evaluation_criterion_scores(
        criterion_code,
        criterion_name,
        score
      ),
      internship:internships!inner(
        id,
        student_id,
        position,
        department,
        company:companies!inner(
          id,
          name
        ),
        student:users!student_id(
          id,
          university_id,
          university:universities(
            id,
            name
          )
        )
      )
    `)
    .in('status', ['submitted', 'approved'])
    .not('supervisor_comments', 'is', null)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  // Apply limit filter
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data: evaluations, error } = await query;

  if (error) {
    console.error('❌ [Analytics] Error fetching evaluations:', error);
    throw new Error(`Failed to fetch evaluations: ${error.message}`);
  }

  if (!evaluations || evaluations.length === 0) {
    console.log('⚠️ [Analytics] No submitted evaluations found');
    return [];
  }

  // Resolve fallback university in case any student record is missing university_id
  let fallbackUniversity: { id: string; name: string } | null = null;
  const hasMissingUniversity = evaluations.some(
    (e: any) => e.internship && e.internship.company && !e.internship.student?.university
  );
  if (hasMissingUniversity) {
    let uniQuery = supabase.from('universities').select('id, name');
    if (options.universityId) {
      uniQuery = uniQuery.eq('id', options.universityId);
    }
    const { data: defaultUni } = await uniQuery.limit(1).maybeSingle();
    fallbackUniversity = defaultUni || {
      id: options.universityId || 'cvsu-bacoor',
      name: 'Cavite State University - Bacoor City Campus',
    };
  }

  // Transform to EvaluationData format expected by AI service
  const transformedEvaluations: EvaluationData[] = evaluations
    .filter((e: any) => e.internship && e.internship.company)
    .map((e: any) => {
      const effectiveTimestamp =
        e.submitted_at || e.approved_at || e.created_at || new Date().toISOString();
      const studentUniversity = e.internship.student?.university || fallbackUniversity;

      return {
        evaluation_id: e.id,
        internship_id: e.internship_id,
        student_id: e.internship.student_id,
        supervisor_id: e.supervisor_id,
        advisor_id: e.advisor_id,
        company_id: e.internship.company.id,
        company_name: e.internship.company.name,
        university_id: studentUniversity?.id || options.universityId || 'cvsu-bacoor',
        university_name: studentUniversity?.name || 'Cavite State University - Bacoor City Campus',
        position: e.internship.position || 'Intern',
        department: e.internship.department,
        supervisor_comments: e.supervisor_comments,
        total_score: e.total_score,
        final_grade: e.final_grade,
        attendance: e.attendance,
        punctuality: e.punctuality,
        criterion_scores: e.criterion_scores?.map((cs: any) => ({
          criterion_code: cs.criterion_code,
          criterion_name: cs.criterion_name,
          score: cs.score,
        })) || [],
        approved_at: e.approved_at || effectiveTimestamp,
        submitted_at: e.submitted_at || effectiveTimestamp,
      };
    });

  // Filter by date range, university, and company if specified
  let filteredEvaluations = transformedEvaluations;

  if (options.dateFrom) {
    const fromTime = new Date(options.dateFrom).getTime();
    if (!isNaN(fromTime)) {
      filteredEvaluations = filteredEvaluations.filter((e) => {
        const evalTime = new Date(e.submitted_at || e.approved_at).getTime();
        return !isNaN(evalTime) && evalTime >= fromTime;
      });
    }
  }

  if (options.dateTo) {
    const toTime = new Date(options.dateTo).getTime();
    if (!isNaN(toTime)) {
      filteredEvaluations = filteredEvaluations.filter((e) => {
        const evalTime = new Date(e.submitted_at || e.approved_at).getTime();
        return !isNaN(evalTime) && evalTime <= toTime;
      });
    }
  }

  if (options.universityId) {
    filteredEvaluations = filteredEvaluations.filter(
      (e) => !e.university_id || e.university_id === options.universityId
    );
  }

  if (options.companyId) {
    filteredEvaluations = filteredEvaluations.filter((e) => e.company_id === options.companyId);
  }

  console.log(`✅ [Analytics] Fetched ${filteredEvaluations.length} evaluations for analysis`);
  return filteredEvaluations;
}

/**
 * Get comprehensive trend analysis
 */
export async function getTrendAnalysis(
  options: TrendAnalysisOptions & {
    limit?: number;
    universityId?: string;
    companyId?: string;
  } = {}
): Promise<TrendAnalysisResponse> {
  console.log('🔵 [Analytics] Starting trend analysis');

  // Check AI service availability
  const isAvailable = await aiService.isServiceAvailable();
  if (!isAvailable) {
    console.warn('⚠️ [Analytics] AI service unavailable');
    return aiService.getFallbackTrendAnalysis();
  }

  // Fetch evaluations
  const evaluations = await fetchApprovedEvaluationsForAnalysis({
    limit: options.limit || 200,
    universityId: options.universityId,
    companyId: options.companyId,
    dateFrom: options.date_range_start,
    dateTo: options.date_range_end,
  });

  if (evaluations.length === 0) {
    return {
      status: 'error',
      total_evaluations_analyzed: 0,
      analysis_period: { start_date: '', end_date: '', total_months: 0 },
      insights: [{
        type: 'performance',
        category: 'data',
        title: 'No Evaluations Available',
        description: 'There are no submitted evaluations to analyze yet.',
        data: {}
      }],
      company_performance: [],
      university_performance: [],
      skill_trends: undefined,
      sentiment_trends: [],
      recommendations: [],
      generated_at: new Date().toISOString(),
      processing_time_ms: 0,
      ai_version: 'fallback',
    };
  }

  // Call AI service
  return await aiService.analyzeTrends(evaluations, {
    include_recommendations: options.include_recommendations ?? true,
    top_n_skills: options.top_n_skills ?? 10,
    top_n_companies: options.top_n_companies ?? 10,
    date_range_start: options.date_range_start,
    date_range_end: options.date_range_end,
  });
}

/**
 * Get quick dashboard insights
 */
export async function getDashboardInsights(
  options: {
    maxInsights?: number;
    limit?: number;
    universityId?: string;
  } = {}
): Promise<DashboardInsightsResponse> {
  console.log('🔵 [Analytics] Getting dashboard insights');

  // Check AI service availability
  const isAvailable = await aiService.isServiceAvailable();
  if (!isAvailable) {
    console.warn('⚠️ [Analytics] AI service unavailable');
    return aiService.getFallbackInsights();
  }

  // Fetch recent evaluations (smaller set for quick insights)
  const evaluations = await fetchApprovedEvaluationsForAnalysis({
    limit: options.limit || 50,
    universityId: options.universityId,
  });

  if (evaluations.length === 0) {
    return {
      status: 'no_data',
      total_evaluations: 0,
      insights: [{
        type: 'performance',
        category: 'data',
        title: 'No Evaluations Available',
        description: 'There are no submitted evaluations to analyze yet.',
        data: {}
      }],
      quick_stats: {},
      generated_at: new Date().toISOString(),
    };
  }

  return await aiService.getDashboardInsights(evaluations, options.maxInsights ?? 5);
}

/**
 * Get company performance rankings
 */
export async function getCompanyPerformance(
  options: {
    topN?: number;
    limit?: number;
    universityId?: string;
  } = {}
): Promise<CompanyPerformance[]> {
  console.log('🔵 [Analytics] Getting company performance');

  const evaluations = await fetchApprovedEvaluationsForAnalysis({
    limit: options.limit || 200,
    universityId: options.universityId,
  });

  if (evaluations.length === 0) {
    return [];
  }

  return await aiService.getCompanyPerformance(evaluations, options.topN ?? 10);
}

/**
 * Get university performance comparison
 */
export async function getUniversityPerformance(
  options: {
    limit?: number;
    companyId?: string;
  } = {}
): Promise<UniversityPerformance[]> {
  console.log('🔵 [Analytics] Getting university performance');

  const evaluations = await fetchApprovedEvaluationsForAnalysis({
    limit: options.limit || 200,
    companyId: options.companyId,
  });

  if (evaluations.length === 0) {
    return [];
  }

  return await aiService.getUniversityPerformance(evaluations);
}

/**
 * Get university-company performance matrix
 */
export async function getUniversityCompanyMatrix(
  options: {
    limit?: number;
  } = {}
): Promise<Record<string, Record<string, { avg_score: number; count: number }>>> {
  console.log('🔵 [Analytics] Getting university-company matrix');

  const evaluations = await fetchApprovedEvaluationsForAnalysis({
    limit: options.limit || 200,
  });

  if (evaluations.length === 0) {
    return {};
  }

  return await aiService.getUniversityCompanyMatrix(evaluations);
}

/**
 * Get skill demand analysis
 */
export async function getSkillAnalysis(
  options: {
    topN?: number;
    limit?: number;
    universityId?: string;
    companyId?: string;
  } = {}
): Promise<SkillTrends | null> {
  console.log('🔵 [Analytics] Getting skill analysis');

  const evaluations = await fetchApprovedEvaluationsForAnalysis({
    limit: options.limit || 200,
    universityId: options.universityId,
    companyId: options.companyId,
  });

  if (evaluations.length === 0) {
    return null;
  }

  return await aiService.getSkillAnalysis(evaluations, options.topN ?? 10);
}

// Export types for use in routes
export type {
  EvaluationData,
  TrendAnalysisResponse,
  DashboardInsightsResponse,
  CompanyPerformance,
  UniversityPerformance,
  SkillTrends,
};
