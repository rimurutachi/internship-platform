import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { Evaluation, CreateEvaluationDTO, ProcessEvaluationResult } from '../models/evaluation';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class EvaluationService {
    async create(data: CreateEvaluationDTO): Promise<Evaluation> {
        const { data: evaluation, error } = await supabase
            .from('evaluations')
            .insert({
                ...data,
                status: 'draft'
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return evaluation;
    }

    async getById(id: string): Promise<Evaluation | null> {
        const { data, error } = await supabase
            .from('evaluations')
            .select(`
                *,
                internship:internships(
                *,
                student:users!student_id(id, first_name, last_name),
                company:companies(id, name)
                ),
                supervisor:users!supervisor_id(id, first_name, last_name)
                `)
            .eq('id',id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async processWithAI(evaluationId: string): Promise<ProcessEvaluationResult> {
        // Get evaluation
        const evaluation = await this.getById(evaluationId);
        if (!evaluation) throw new Error('Evaluation not found.');

        // Call AI Service
        const response = await axios.post(`${AI_SERVICE_URL}/api/evaluate`, {
            feedback_text: evaluation.feedback_text,
            ratings: {
                overall: evaluation.rating_overall,
                technical: evaluation.rating_technical,
                communication: evaluation.rating_communication,
                work_ethic: evaluation.rating_work_ethic
            }
        });

        const aiResult = response.data;

        // Update evaluation with AI results.
        const { data: updated, error } = await supabase
            .from('evaluations')
            .update({
                lit_features: aiResult.lit_features,
                sentiment_scores: aiResult.sentiment_scores,
                recommended_grade: aiResult.recommended_grade,
                confidence_score: aiResult.confidence_score,
                bias_check_passed: aiResult.bias_check_passed,
                status: 'processed',
                processed_at: new Date().toISOString()
            })
            .eq('id', evaluationId)
            .select()
            .single();
        
        if (error) throw new Error(error.message);
        return {
            evaluation: updated,
            aiResult: aiResult
        };
    }

    async submit(evaluationId: string): Promise<Evaluation> {
        const { data, error } = await supabase
            .from('evaluations')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString()
            })
            .eq('id', evaluationId)
            .select()
            .single();
        
        if (error) throw new Error(error.message);

        // Trigger AI Processing
        await this.processWithAI(evaluationId);
        return data;
    }

    async approve(evaluationId: string, finalGrade: number): Promise<Evaluation> {
        const { data, error } = await supabase
            .from('evaluations')
            .update({
                final_grade: finalGrade,
                status: 'approved'
            })
            .eq('id', evaluationId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async getByInternship(internshipId: string): Promise<Evaluation[]> {
        const { data, error } = await supabase
            .from('evaluations')
            .select('*')
            .eq('internship_id', internshipId)
            .order('created_at', { ascending:false });

        if (error) throw new Error(error.message);
        return data || [];
    }
}