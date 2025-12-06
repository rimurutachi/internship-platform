/**
 * Evaluation Service - Core CRUD & AI Processing
 * 
 * Handles evaluation creation, AI analysis, submission, and approval workflow.
 * Use EvaluationServiceFacade (evaluation.service.ts) for a unified API that includes analytics.
 * 
 * @deprecated Consider using EvaluationServiceFacade for new code
 */

import { createClient } from '@supabase/supabase-js';
import axios from "axios";
import {
  Evaluation,
  CreateEvaluationDTO,
  ProcessEvaluationResult,
  EvaluationAIAnalysis,
} from "../models/evaluation";
import { emitEvaluationUpdate } from "../socket/emitters";
import aiService from './aiService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export class EvaluationService {
  async create(data: CreateEvaluationDTO): Promise<Evaluation> {
    const { data: evaluation, error } = await supabase
      .from("evaluations")
      .insert({
        ...data,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Real-time emit
    emitEvaluationUpdate(evaluation.id, {
      event: "evaluation_created",
      evaluation,
    });
    return evaluation;
  }

  /**
   * Analyze draft evaluation text (lightweight, real-time feedback)
   * 
   * @param text - Evaluation feedback text
   * @returns Draft analysis with features and sentiment
   */
  async analyzeDraft(text: string) {
    if (!text || text.trim().length < 5) {
      throw new Error('Text is too short for analysis (minimum 5 characters)');
    }

    try {
      const result = await aiService.analyzeDraft(text);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to analyze draft: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getById(id: string): Promise<Evaluation | null> {
    const { data, error } = await supabase
      .from("evaluations")
      .select(
        `
                *,
                internship:internships(
                *,
                student:users!student_id(id, first_name, last_name),
                company:companies(id, name)
                ),
                supervisor:users!supervisor_id(id, first_name, last_name)
                `
      )
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, data: any): Promise<Evaluation> {
    // Check if evaluation exists and is still in draft status
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Evaluation not found');
    }
    if (existing.status !== 'draft') {
      throw new Error('Can only update draft evaluations');
    }

    // Update evaluation
    const { data: updated, error } = await supabase
      .from('evaluations')
      .update({
        feedback_text: data.feedback_text,
        rating_overall: data.rating_overall,
        rating_technical: data.rating_technical,
        rating_communication: data.rating_communication,
        rating_work_ethic: data.rating_work_ethic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
                *,
                internship:internships(
                *,
                student:users!student_id(id, first_name, last_name),
                company:companies(id, name)
                ),
                supervisor:users!supervisor_id(id, first_name, last_name)
                `
      )
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  async processWithAI(evaluationId: string): Promise<ProcessEvaluationResult> {
    // Get evaluation
    const evaluation = await this.getById(evaluationId);
    if (!evaluation) throw new Error("Evaluation not found.");

    // Call AI Service
    const response = await axios.post(`${AI_SERVICE_URL}/api/evaluate`, {
      feedback_text: evaluation.feedback_text,
      ratings: {
        overall: evaluation.rating_overall,
        technical: evaluation.rating_technical,
        communication: evaluation.rating_communication,
        work_ethic: evaluation.rating_work_ethic,
      },
    });

    const aiResult = response.data;

    // Update evaluation with AI results.
    const { data: updated, error } = await supabase
      .from("evaluations")
      .update({
        lit_features: aiResult.lit_features,
        sentiment_scores: aiResult.sentiment_scores,
        recommended_grade: aiResult.recommended_grade,
        confidence_score: aiResult.confidence_score,
        bias_check_passed: aiResult.bias_check_passed,
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", evaluationId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Real-time emit
    emitEvaluationUpdate(evaluationId, {
      event: "evaluation_processed",
      evaluation: updated,
      aiResult,
    });
    return {
      evaluation: updated,
      aiResult: aiResult,
    };
  }

  async submit(evaluationId: string): Promise<any> {
    // Step 1: Fetch existing evaluation record
    const evaluation = await this.getById(evaluationId);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    if (!evaluation.feedback_text || evaluation.feedback_text.trim().length < 10) {
      throw new Error('Feedback text is too short for submission (minimum 10 characters)');
    }

    try {
      // Step 2: Call AI Service with text and ratings
      const aiResult = await aiService.analyzeEvaluation(
        evaluation.feedback_text,
        {
          rating_overall: evaluation.rating_overall,
          rating_technical: evaluation.rating_technical,
          rating_communication: evaluation.rating_communication,
          rating_work_ethic: evaluation.rating_work_ethic,
        }
      );

      // Step 3: Insert AI analysis result into evaluations_ai_analysis table
      // Map AI service response to database schema
      // Phase 1: Extract bias flags - handle both string[] and object[] formats
      const biasFlags = Array.isArray(aiResult.bias_check.flags)
        ? aiResult.bias_check.flags.map((flag: any) => 
            typeof flag === 'string' ? flag : (flag.type || flag.description || JSON.stringify(flag))
          )
        : [];

      const { data: aiAnalysisRecord, error: aiError } = await supabase
        .from('evaluations_ai_analysis')
        .insert({
          evaluation_id: evaluationId,
          extracted_technical_skills: aiResult.features.technical_skills,
          extracted_soft_skills: aiResult.features.soft_skills,
          key_achievements: [], // Can be extracted later or from additional AI processing
          areas_for_improvement: [], // Can be extracted later or from additional AI processing
          sentiment_positive_score: aiResult.sentiment.breakdown?.positive || 0,
          sentiment_neutral_score: aiResult.sentiment.breakdown?.neutral || 0,
          sentiment_negative_score: aiResult.sentiment.breakdown?.negative || 0,
          overall_sentiment: aiResult.sentiment.label,
          ai_recommendations: [], // Can be generated from bias check or additional processing
          suggested_improvements: [], // Can be generated from additional processing
          potential_biases: biasFlags,
          ai_model_version: 'v1.1.0-phase1', // Updated version
          processing_time_ms: aiResult.processing_time_ms,
          overall_confidence_score: aiResult.confidence_score,
        })
        .select()
        .single();

      if (aiError) {
        throw new Error(`Failed to save AI analysis: ${aiError.message}`);
      }

      // Step 4: Update evaluations table with AI analysis link and status
      const { data: updatedEvaluation, error: updateError } = await supabase
        .from('evaluations')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          ai_analysis_id: aiAnalysisRecord.id,
          bias_check_passed: aiResult.bias_check.passed,
          confidence_score: aiResult.confidence_score,
        })
        .eq('id', evaluationId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update evaluation: ${updateError.message}`);
      }

      // Step 5: Real-time emit
      emitEvaluationUpdate(evaluationId, {
        event: 'evaluation_submitted',
        evaluation: updatedEvaluation,
      });

      // Step 6: Return combined result
      return {
        evaluation: updatedEvaluation,
        ai_analysis: aiAnalysisRecord,
      };
    } catch (error) {
      // If AI service fails, still submit evaluation but without AI analysis
      console.error('AI analysis failed during submission:', error);
      
      const { data: updatedEvaluation, error: updateError } = await supabase
        .from('evaluations')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', evaluationId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update evaluation: ${updateError.message}`);
      }

      emitEvaluationUpdate(evaluationId, {
        event: 'evaluation_submitted',
        evaluation: updatedEvaluation,
      });

      return {
        evaluation: updatedEvaluation,
        ai_analysis: null,
        warning: 'AI analysis unavailable',
      };
    }
  }

  async approve(evaluationId: string, finalGrade: number): Promise<Evaluation> {
    const { data, error } = await supabase
      .from("evaluations")
      .update({
        final_grade: finalGrade,
        status: "approved",
      })
      .eq("id", evaluationId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Real-time emit
    emitEvaluationUpdate(evaluationId, {
      event: "evaluation_approved",
      evaluation: data,
      finalGrade,
    });
    return data;
  }

  async getByInternship(internshipId: string): Promise<Evaluation[]> {
    const { data, error } = await supabase
      .from("evaluations")
      .select("*")
      .eq("internship_id", internshipId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Get evaluations by supervisor with optional filters
   */
  async getBySupervisor(supervisorId?: string, status?: string): Promise<any[]> {
    let query = supabase
      .from("evaluations")
      .select(`
        *,
        internship:internships(
          id,
          position,
          student:users!student_id(id, first_name, last_name, email),
          company:companies(id, name)
        )
      `)
      .order("created_at", { ascending: false });

    if (supervisorId) {
      query = query.eq("supervisor_id", supervisorId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Get all evaluations with filters (admin/general query)
   */
  async getAll(filters?: {
    supervisor_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = supabase
      .from("evaluations")
      .select(`
        *,
        internship:internships(
          id,
          position,
          student:users!student_id(id, first_name, last_name, email),
          company:companies(id, name)
        ),
        supervisor:users!supervisor_id(id, first_name, last_name, email)
      `)
      .order("created_at", { ascending: false });

    if (filters?.supervisor_id) {
      query = query.eq("supervisor_id", filters.supervisor_id);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  }
}
