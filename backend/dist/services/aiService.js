"use strict";
/**
 * AI Service Client - v2.0.0 Trend Analysis
 *
 * Handles communication with Python FastAPI AI Service for historical trend analysis.
 * Provides decision support for internship placements based on approved evaluation data.
 *
 * @version 2.0.0
 * @purpose Decision support for admin based on historical evaluation trends
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
// =============================================================================
// AI SERVICE CLASS - Trend Analysis Client
// =============================================================================
/**
 * AI Service class for historical trend analysis
 * @version 2.0.0
 */
class AIService {
    constructor() {
        this.isAvailable = true;
        this.serviceVersion = 'unknown';
        this.client = axios_1.default.create({
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
    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            this.isAvailable = response.data.status === 'healthy';
            this.serviceVersion = response.data.version;
            console.log(`✅ AI Service v${this.serviceVersion} connected`);
        }
        catch (error) {
            console.warn('⚠️ AI Service not available:', error instanceof Error ? error.message : 'Unknown error');
            this.isAvailable = false;
        }
    }
    /**
     * Check if AI service is currently available
     */
    async isServiceAvailable() {
        try {
            await this.client.get('/health', { timeout: 5000 });
            this.isAvailable = true;
            return true;
        }
        catch {
            this.isAvailable = false;
            return false;
        }
    }
    /**
     * Get AI service health status
     */
    async getHealthStatus() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        }
        catch (error) {
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
    async analyzeTrends(evaluations, options = {}) {
        try {
            console.log(`🔵 AI Service: Analyzing trends for ${evaluations.length} evaluations`);
            const response = await this.client.post('/api/analyze-trends', {
                evaluations,
                include_recommendations: options.include_recommendations ?? true,
                top_n_skills: options.top_n_skills ?? 10,
                top_n_companies: options.top_n_companies ?? 10,
                date_range_start: options.date_range_start,
                date_range_end: options.date_range_end,
            });
            console.log(`✅ Trend analysis complete: ${response.data.insights.length} insights generated`);
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
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
    async getDashboardInsights(evaluations, maxInsights = 5) {
        try {
            console.log(`🔵 AI Service: Getting dashboard insights for ${evaluations.length} evaluations`);
            const response = await this.client.post('/api/dashboard-insights', {
                evaluations,
                max_insights: maxInsights,
            });
            console.log(`✅ Dashboard insights generated: ${response.data.insights.length} insights`);
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
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
    async getCompanyPerformance(evaluations, topN = 10) {
        try {
            console.log(`🔵 AI Service: Analyzing company performance`);
            const response = await this.client.post('/api/company-performance', {
                evaluations,
                top_n: topN,
            });
            return response.data.companies;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
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
    async getUniversityPerformance(evaluations) {
        try {
            console.log(`🔵 AI Service: Analyzing university performance`);
            const response = await this.client.post('/api/university-performance', {
                evaluations,
            });
            return response.data.universities;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
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
    async getUniversityCompanyMatrix(evaluations) {
        try {
            console.log(`🔵 AI Service: Building university-company performance matrix`);
            const response = await this.client.post('/api/university-company-matrix', {
                evaluations,
            });
            return response.data.matrix;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
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
    async getSkillAnalysis(evaluations, topN = 10) {
        try {
            console.log(`🔵 AI Service: Analyzing skill trends`);
            const response = await this.client.post('/api/skill-analysis', {
                evaluations,
                top_n: topN,
            });
            return response.data.skill_trends;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
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
    getFallbackInsights() {
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
    getFallbackTrendAnalysis() {
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
exports.default = new AIService();
//# sourceMappingURL=aiService.js.map