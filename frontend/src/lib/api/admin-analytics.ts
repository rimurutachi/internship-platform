/**
 * Admin Analytics API Client
 * 
 * API client for AI-powered trend analysis on approved evaluations.
 * Used by admin dashboard and analytics pages.
 * 
 * @version 2.0.0
 */

import { get } from './client';

// =============================================================================
// TYPES - Aligned with Backend
// =============================================================================

export interface SkillFrequency {
  name: string;
  count: number;
  percentage: number;
  category: 'technical' | 'soft';
}

export interface CompanyPerformance {
  company_id: string;
  company_name: string;
  total_evaluations: number;
  average_score: number;
  average_grade: number;
  sentiment_score: number;
  sentiment_label: 'positive' | 'neutral' | 'negative';
  top_skills: string[];
  performance_rating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
}

export interface UniversityPerformance {
  university_id: string;
  university_name: string;
  total_evaluations: number;
  total_students: number;
  average_score: number;
  average_grade: number;
  sentiment_score: number;
  top_companies: string[];
  weak_companies: string[];
}

export interface SentimentTrend {
  period: string;
  average_score: number;
  label: 'positive' | 'neutral' | 'negative';
  evaluation_count: number;
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
}

export interface SkillTrends {
  technical_skills: SkillFrequency[];
  soft_skills: SkillFrequency[];
  total_unique_skills: number;
  most_demanded_overall: SkillFrequency[];
}

export interface Recommendation {
  type: 'recommendation' | 'warning' | 'insight';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affected_entity?: string;
  supporting_data?: Record<string, unknown>;
}

export interface Insight {
  type: 'sentiment_trend' | 'skill_analysis' | 'performance' | 'comparison';
  category: string;
  title: string;
  description: string;
  data?: Record<string, unknown>;
}

export interface AnalysisPeriod {
  start_date: string;
  end_date: string;
  total_months: number;
}

export interface TrendAnalysisResponse {
  status: 'success' | 'partial' | 'error';
  total_evaluations_analyzed: number;
  analysis_period: AnalysisPeriod;
  insights: Insight[];
  company_performance: CompanyPerformance[];
  university_performance: UniversityPerformance[];
  skill_trends?: SkillTrends;
  sentiment_trends: SentimentTrend[];
  recommendations: Recommendation[];
  generated_at: string;
  processing_time_ms: number;
  ai_version: string;
}

export interface DashboardInsightsResponse {
  status: string;
  total_evaluations: number;
  insights: Insight[];
  quick_stats: {
    total_companies?: number;
    total_universities?: number;
    average_sentiment?: number;
    top_skill?: string;
    best_company?: string;
  };
  generated_at: string;
}

export interface AIHealthResponse {
  service: string;
  status: string;
  version: string;
  components: Record<string, string>;
  capabilities: string[];
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

interface TrendAnalysisParams {
  limit?: number;
  university_id?: string;
  company_id?: string;
  date_from?: string;
  date_to?: string;
  top_skills?: number;
  top_companies?: number;
}

/**
 * Get comprehensive trend analysis
 */
export async function getTrendAnalysis(params: TrendAnalysisParams = {}): Promise<TrendAnalysisResponse> {
  const queryParams: Record<string, string> = {};
  
  if (params.limit) queryParams.limit = params.limit.toString();
  if (params.university_id) queryParams.university_id = params.university_id;
  if (params.company_id) queryParams.company_id = params.company_id;
  if (params.date_from) queryParams.date_from = params.date_from;
  if (params.date_to) queryParams.date_to = params.date_to;
  if (params.top_skills) queryParams.top_skills = params.top_skills.toString();
  if (params.top_companies) queryParams.top_companies = params.top_companies.toString();

  const response = await get<{ success: boolean; data: TrendAnalysisResponse }>('/admin/analytics/trends', queryParams);
  return response.data;
}

/**
 * Get quick dashboard insights
 */
export async function getDashboardInsights(params: {
  max_insights?: number;
  limit?: number;
  university_id?: string;
} = {}): Promise<DashboardInsightsResponse> {
  const queryParams: Record<string, string> = {};
  
  if (params.max_insights) queryParams.max_insights = params.max_insights.toString();
  if (params.limit) queryParams.limit = params.limit.toString();
  if (params.university_id) queryParams.university_id = params.university_id;

  const response = await get<{ success: boolean; data: DashboardInsightsResponse }>('/admin/analytics/dashboard-insights', queryParams);
  return response.data;
}

/**
 * Get company performance rankings
 */
export async function getCompanyPerformance(params: {
  top_n?: number;
  limit?: number;
  university_id?: string;
} = {}): Promise<CompanyPerformance[]> {
  const queryParams: Record<string, string> = {};
  
  if (params.top_n) queryParams.top_n = params.top_n.toString();
  if (params.limit) queryParams.limit = params.limit.toString();
  if (params.university_id) queryParams.university_id = params.university_id;

  const response = await get<{ success: boolean; data: { companies: CompanyPerformance[]; count: number } }>('/admin/analytics/companies', queryParams);
  return response.data.companies;
}

/**
 * Get university performance comparison
 */
export async function getUniversityPerformance(params: {
  limit?: number;
  company_id?: string;
} = {}): Promise<UniversityPerformance[]> {
  const queryParams: Record<string, string> = {};
  
  if (params.limit) queryParams.limit = params.limit.toString();
  if (params.company_id) queryParams.company_id = params.company_id;

  const response = await get<{ success: boolean; data: { universities: UniversityPerformance[]; count: number } }>('/admin/analytics/universities', queryParams);
  return response.data.universities;
}

/**
 * Get university-company performance matrix
 */
export async function getUniversityCompanyMatrix(params: {
  limit?: number;
} = {}): Promise<Record<string, Record<string, { avg_score: number; count: number }>>> {
  const queryParams: Record<string, string> = {};
  
  if (params.limit) queryParams.limit = params.limit.toString();

  const response = await get<{ success: boolean; data: { matrix: Record<string, Record<string, { avg_score: number; count: number }>> } }>('/admin/analytics/matrix', queryParams);
  return response.data.matrix;
}

/**
 * Get skill demand analysis
 */
export async function getSkillAnalysis(params: {
  top_n?: number;
  limit?: number;
  university_id?: string;
  company_id?: string;
} = {}): Promise<SkillTrends> {
  const queryParams: Record<string, string> = {};
  
  if (params.top_n) queryParams.top_n = params.top_n.toString();
  if (params.limit) queryParams.limit = params.limit.toString();
  if (params.university_id) queryParams.university_id = params.university_id;
  if (params.company_id) queryParams.company_id = params.company_id;

  const response = await get<{ success: boolean; data: SkillTrends }>('/admin/analytics/skills', queryParams);
  return response.data;
}

/**
 * Check AI service health
 */
export async function getAIServiceHealth(): Promise<AIHealthResponse> {
  const response = await get<{ success: boolean; data: AIHealthResponse }>('/admin/analytics/health');
  return response.data;
}
