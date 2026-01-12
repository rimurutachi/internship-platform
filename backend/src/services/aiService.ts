/**
 * AI Service Client - v2.0.0 Trend Analysis
 * 
 * Handles communication with Python FastAPI AI Service for historical trend analysis.
 * Provides decision support for internship placements based on approved evaluation data.
 * 
 * @version 2.0.0
 * @purpose Decision support for admin based on historical evaluation trends
 */

import axios, { AxiosInstance } from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// =============================================================================
// INPUT TYPES - Aligned with AI Service schemas
// =============================================================================

/**
 * Criterion score from evaluation_criterion_scores table
 */
export interface CriterionScore {
  criterion_code: string;
  criterion_name: string;
  score: number; // 1-10
}

/**
 * Evaluation data for trend analysis - aligned with database schema
 */
export interface EvaluationData {
  evaluation_id: string;
  internship_id: string;
  student_id: string;
  supervisor_id: string;
  advisor_id?: string;
  
  // Company context
  company_id: string;
  company_name: string;
  
  // University context
  university_id: string;
  university_name: string;
  
  // Position/Department
  position: string;
  department?: string;
  
  // Evaluation content
  supervisor_comments: string;
  total_score?: number;
  final_grade?: number; // CvSU 1.0-5.0 scale
  attendance?: 'regular' | 'irregular';
  punctuality?: 'regular' | 'irregular';
  
  // Rubric-based scores
  criterion_scores?: CriterionScore[];
  
  // Timestamps
  approved_at: string;
  submitted_at?: string;
}

/**
 * Options for trend analysis
 */
export interface TrendAnalysisOptions {
  date_range_start?: string;
  date_range_end?: string;
  include_recommendations?: boolean;
  top_n_skills?: number;
  top_n_companies?: number;
}

// =============================================================================
// OUTPUT TYPES - Trend Analysis Results
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
  supporting_data?: Record<string, any>;
}

export interface Insight {
  type: 'sentiment_trend' | 'skill_analysis' | 'performance' | 'comparison';
  category: string;
  title: string;
  description: string;
  data?: Record<string, any>;
}

export interface AnalysisPeriod {
  start_date: string;
  end_date: string;
  total_months: number;
}

/**
 * Complete trend analysis response
 */
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

/**
 * Dashboard quick insights response
 */
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

/**
 * Health check response
 */
export interface HealthResponse {
  service: string;
  status: string;
  version: string;
  components: Record<string, string>;
  capabilities: string[];
}

// =============================================================================
// AI SERVICE CLASS - Trend Analysis Client
// =============================================================================

/**
 * AI Service class for historical trend analysis
 * @version 2.0.0
 */
class AIService {
  private client: AxiosInstance;
  private isAvailable: boolean = true;
  private serviceVersion: string = 'unknown';

  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      timeout: 60000, // 60 second timeout for large analyses
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check service health on initialization
    this.checkHealth();
  }

  /**
   * Check AI service health and update availability status
   */
  private async checkHealth(): Promise<void> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      this.isAvailable = response.data.status === 'healthy';
      this.serviceVersion = response.data.version;
      console.log(`✅ AI Service v${this.serviceVersion} connected`);
    } catch (error) {
      console.warn('⚠️ AI Service not available:', error instanceof Error ? error.message : 'Unknown error');
      this.isAvailable = false;
    }
  }

  /**
   * Check if AI service is currently available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      this.isAvailable = true;
      return true;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Get AI service health status
   */
  async getHealthStatus(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      return response.data;
    } catch (error) {
      throw new Error('AI Service is not responding');
    }
  }

  // ===========================================================================
  // MAIN TREND ANALYSIS METHODS
  // ===========================================================================

  /**
   * Comprehensive trend analysis on historical evaluation data
   * 
   * @param evaluations - Array of approved evaluations with full context
   * @param options - Analysis options (date range, top N, etc.)
   * @returns Complete trend analysis with insights and recommendations
   */
  async analyzeTrends(
    evaluations: EvaluationData[],
    options: TrendAnalysisOptions = {}
  ): Promise<TrendAnalysisResponse> {
    try {
      console.log(`🔵 AI Service: Analyzing trends for ${evaluations.length} evaluations`);
      
      const response = await this.client.post<TrendAnalysisResponse>('/api/analyze-trends', {
        evaluations,
        include_recommendations: options.include_recommendations ?? true,
        top_n_skills: options.top_n_skills ?? 10,
        top_n_companies: options.top_n_companies ?? 10,
        date_range_start: options.date_range_start,
        date_range_end: options.date_range_end,
      });

      console.log(`✅ Trend analysis complete: ${response.data.insights.length} insights generated`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail || error.message;
        console.error('❌ AI Service Error (analyzeTrends):', detail);
        throw new Error(`AI Service Error: ${detail}`);
      }
      throw new Error('Failed to analyze evaluation trends');
    }
  }

  /**
   * Quick insights for admin dashboard (lightweight)
   * 
   * @param evaluations - Array of approved evaluations
   * @param maxInsights - Maximum number of insights to return (default 5)
   * @returns Dashboard insights with quick stats
   */
  async getDashboardInsights(
    evaluations: EvaluationData[],
    maxInsights: number = 5
  ): Promise<DashboardInsightsResponse> {
    try {
      console.log(`🔵 AI Service: Getting dashboard insights for ${evaluations.length} evaluations`);
      
      const response = await this.client.post<DashboardInsightsResponse>('/api/dashboard-insights', {
        evaluations,
        max_insights: maxInsights,
      });

      console.log(`✅ Dashboard insights generated: ${response.data.insights.length} insights`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail || error.message;
        console.error('❌ AI Service Error (getDashboardInsights):', detail);
        throw new Error(`AI Service Error: ${detail}`);
      }
      throw new Error('Failed to get dashboard insights');
    }
  }

  /**
   * Get company performance rankings
   * 
   * @param evaluations - Array of approved evaluations
   * @param topN - Number of companies to return (default 10)
   * @returns Ranked company performance data
   */
  async getCompanyPerformance(
    evaluations: EvaluationData[],
    topN: number = 10
  ): Promise<CompanyPerformance[]> {
    try {
      console.log(`🔵 AI Service: Analyzing company performance`);
      
      const response = await this.client.post<{ companies: CompanyPerformance[] }>('/api/company-performance', {
        evaluations,
        top_n: topN,
      });

      return response.data.companies;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail || error.message;
        throw new Error(`AI Service Error: ${detail}`);
      }
      throw new Error('Failed to get company performance');
    }
  }

  /**
   * Get university performance comparison
   * 
   * @param evaluations - Array of approved evaluations
   * @returns University performance comparison data
   */
  async getUniversityPerformance(
    evaluations: EvaluationData[]
  ): Promise<UniversityPerformance[]> {
    try {
      console.log(`🔵 AI Service: Analyzing university performance`);
      
      const response = await this.client.post<{ universities: UniversityPerformance[] }>('/api/university-performance', {
        evaluations,
      });

      return response.data.universities;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail || error.message;
        throw new Error(`AI Service Error: ${detail}`);
      }
      throw new Error('Failed to get university performance');
    }
  }

  /**
   * Get university-company cross-tabulation matrix
   * Shows where each university's students perform best/worst
   * 
   * @param evaluations - Array of approved evaluations
   * @returns Matrix of university performance by company
   */
  async getUniversityCompanyMatrix(
    evaluations: EvaluationData[]
  ): Promise<Record<string, Record<string, { avg_score: number; count: number }>>> {
    try {
      console.log(`🔵 AI Service: Building university-company performance matrix`);
      
      const response = await this.client.post<{ matrix: Record<string, Record<string, { avg_score: number; count: number }>> }>('/api/university-company-matrix', {
        evaluations,
      });

      return response.data.matrix;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail || error.message;
        throw new Error(`AI Service Error: ${detail}`);
      }
      throw new Error('Failed to get university-company matrix');
    }
  }

  /**
   * Get skill demand analysis
   * 
   * @param evaluations - Array of approved evaluations
   * @param topN - Number of top skills to return
   * @returns Skill trends and demand analysis
   */
  async getSkillAnalysis(
    evaluations: EvaluationData[],
    topN: number = 10
  ): Promise<SkillTrends> {
    try {
      console.log(`🔵 AI Service: Analyzing skill trends`);
      
      const response = await this.client.post<{ skill_trends: SkillTrends }>('/api/skill-analysis', {
        evaluations,
        top_n: topN,
      });

      return response.data.skill_trends;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail || error.message;
        throw new Error(`AI Service Error: ${detail}`);
      }
      throw new Error('Failed to get skill analysis');
    }
  }

  // ===========================================================================
  // FALLBACK & UTILITIES
  // ===========================================================================

  /**
   * Get fallback response when AI service is unavailable
   */
  getFallbackInsights(): DashboardInsightsResponse {
    return {
      status: 'unavailable',
      total_evaluations: 0,
      insights: [{
        type: 'performance',
        category: 'system',
        title: 'AI Service Unavailable',
        description: 'AI trend analysis is temporarily unavailable. Please try again later.',
        data: {}
      }],
      quick_stats: {},
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Get fallback response for trend analysis
   */
  getFallbackTrendAnalysis(): TrendAnalysisResponse {
    return {
      status: 'error',
      total_evaluations_analyzed: 0,
      analysis_period: {
        start_date: '',
        end_date: '',
        total_months: 0,
      },
      insights: [{
        type: 'performance',
        category: 'system',
        title: 'AI Service Unavailable',
        description: 'AI trend analysis is temporarily unavailable. Please try again later.',
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
}

// Export singleton instance
export default new AIService();
