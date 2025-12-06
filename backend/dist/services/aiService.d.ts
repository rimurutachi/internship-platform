/**
 * AI Service Client
 *
 * Handles communication with Python FastAPI AI Service for evaluation analysis.
 * Provides methods for draft analysis and full evaluation processing.
 */
/**
 * Complete AI analysis result from the Python service
 */
export interface AIAnalysisResult {
    features: {
        technical_skills: string[];
        soft_skills: string[];
    };
    sentiment: {
        score: number;
        label: string;
        breakdown: Record<string, any>;
        tone?: string;
        intensity?: string;
        subjectivity?: number;
        context_flags?: string[];
        insights?: string[];
    };
    bias_check: {
        passed: boolean;
        flags: any[];
        consistency_score?: number;
        severity?: string;
    };
    llt_guidance?: any;
    feedback_quality?: any;
    confidence_score: number;
    processing_time_ms: number;
}
/**
 * Draft analysis result (lightweight, no bias check)
 */
export interface DraftAnalysisResult {
    status: string;
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
/**
 * AI Service class for evaluation analysis
 */
declare class AIService {
    private client;
    private isAvailable;
    constructor();
    /**
     * Check if AI service is available
     */
    private checkHealth;
    /**
     * Analyze draft evaluation (lightweight, for real-time feedback)
     *
     * @param text - Evaluation feedback text
     * @returns Draft analysis with features and sentiment (no bias check)
     */
    analyzeDraft(text: string): Promise<DraftAnalysisResult>;
    /**
     * Analyze complete evaluation with bias detection
     *
     * @param text - Evaluation feedback text
     * @param ratings - Numeric ratings for different aspects
     * @returns Complete AI analysis including bias check
     */
    analyzeEvaluation(text: string, ratings: {
        rating_overall?: number;
        rating_technical?: number;
        rating_communication?: number;
        rating_work_ethic?: number;
    }): Promise<AIAnalysisResult>;
    /**
     * Get fallback analysis when AI service is unavailable
     *
     * @param text - Evaluation feedback text
     * @returns Basic fallback analysis
     */
    getFallbackAnalysis(text: string): AIAnalysisResult;
    /**
     * Check if AI service is currently available
     */
    isServiceAvailable(): Promise<boolean>;
}
declare const _default: AIService;
export default _default;
//# sourceMappingURL=aiService.d.ts.map