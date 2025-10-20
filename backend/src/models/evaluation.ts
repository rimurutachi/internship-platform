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
    status: 'draft' | 'submmited' | 'processed' | 'approved';
    submmited_at?: Date;
    processed_at?: Date;
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