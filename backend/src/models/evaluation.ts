export interface Evaluation {
    id: string;
    internship_id: string;
    supervisor_id: string;
    feedback_text: string;
    rating_overall?: number;
    rating_technical?: number;
    rating_communication?: number;
    rating_work_ethic?: number;
    lit_features?: any;
    sentiment_scores?: any;
    recommended_grade?: number;
    final_grade?: number;
    confidence_score?: number;
    bias_check_passed?: boolean;
    ai_analysis_id?: string;
    status: 'draft' | 'submitted' | 'processed' | 'approved';
    submmited_at?: Date;
    processed_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface EvaluationAIAnalysis {
    id: string;
    evaluation_id: string;
    extracted_technical_skills: string[];
    extracted_soft_skills: string[];
    key_achievements: string[];
    areas_for_improvement: string[];
    sentiment_positive_score: number;
    sentiment_neutral_score: number;
    sentiment_negative_score: number;
    overall_sentiment: 'positive' | 'neutral' | 'negative';
    ai_recommendations: string[];
    suggested_improvements: string[];
    potential_biases: string[];
    ai_model_version?: string;
    processing_time_ms: number;
    overall_confidence_score: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateEvaluationDTO {
    internship_id: string;
    supervisor_id: string;
    feedback_text: string;
    rating_overall?: number;
    rating_technical?: number;
    rating_communication?: number;
    rating_work_ethic?: number;
}

export interface ProcessEvaluationResult {
    evaluation: Evaluation;
    aiResult: {
        lit_features: any;
        sentiment_scores: any;
        recommended_grade: number;
        confidence_score: number;
        bias_check_passed: boolean;
    };
}