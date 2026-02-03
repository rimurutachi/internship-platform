/**
 * AI Service Client - v2.0.0 Trend Analysis
 *
 * Handles communication with Python FastAPI AI Service for historical trend analysis.
 * Provides decision support for internship placements based on approved evaluation data.
 *
 * @version 2.0.0
 * @purpose Decision support for admin based on historical evaluation trends
 */
/**
 * Criterion score from evaluation_criterion_scores table
 */
export interface CriterionScore {
    criterion_code: string;
    criterion_name: string;
    score: number;
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
    company_id: string;
    company_name: string;
    university_id: string;
    university_name: string;
    position: string;
    department?: string;
    supervisor_comments: string;
    total_score?: number;
    final_grade?: number;
    attendance?: 'regular' | 'irregular';
    punctuality?: 'regular' | 'irregular';
    criterion_scores?: CriterionScore[];
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
/**
 * AI Service class for historical trend analysis
 * @version 2.0.0
 */
declare class AIService {
    private client;
    private isAvailable;
    private serviceVersion;
    constructor();
    /**
     * Check AI service health and update availability status
     */
    private checkHealth;
    /**
     * Check if AI service is currently available
     */
    isServiceAvailable(): Promise<boolean>;
    /**
     * Get AI service health status
     */
    getHealthStatus(): Promise<HealthResponse>;
    /**
     * Comprehensive trend analysis on historical evaluation data
     *
     * @param evaluations - Array of approved evaluations with full context
     * @param options - Analysis options (date range, top N, etc.)
     * @returns Complete trend analysis with insights and recommendations
     */
    analyzeTrends(evaluations: EvaluationData[], options?: TrendAnalysisOptions): Promise<TrendAnalysisResponse>;
    /**
     * Quick insights for admin dashboard (lightweight)
     *
     * @param evaluations - Array of approved evaluations
     * @param maxInsights - Maximum number of insights to return (default 5)
     * @returns Dashboard insights with quick stats
     */
    getDashboardInsights(evaluations: EvaluationData[], maxInsights?: number): Promise<DashboardInsightsResponse>;
    /**
     * Get company performance rankings
     *
     * @param evaluations - Array of approved evaluations
     * @param topN - Number of companies to return (default 10)
     * @returns Ranked company performance data
     */
    getCompanyPerformance(evaluations: EvaluationData[], topN?: number): Promise<CompanyPerformance[]>;
    /**
     * Get university performance comparison
     *
     * @param evaluations - Array of approved evaluations
     * @returns University performance comparison data
     */
    getUniversityPerformance(evaluations: EvaluationData[]): Promise<UniversityPerformance[]>;
    /**
     * Get university-company cross-tabulation matrix
     * Shows where each university's students perform best/worst
     *
     * @param evaluations - Array of approved evaluations
     * @returns Matrix of university performance by company
     */
    getUniversityCompanyMatrix(evaluations: EvaluationData[]): Promise<Record<string, Record<string, {
        avg_score: number;
        count: number;
    }>>>;
    /**
     * Get skill demand analysis
     *
     * @param evaluations - Array of approved evaluations
     * @param topN - Number of top skills to return
     * @returns Skill trends and demand analysis
     */
    getSkillAnalysis(evaluations: EvaluationData[], topN?: number): Promise<SkillTrends>;
    /**
     * Get fallback response when AI service is unavailable
     */
    getFallbackInsights(): DashboardInsightsResponse;
    /**
     * Get fallback response for trend analysis
     */
    getFallbackTrendAnalysis(): TrendAnalysisResponse;
}
declare const _default: AIService;
export default _default;
//# sourceMappingURL=aiService.d.ts.map