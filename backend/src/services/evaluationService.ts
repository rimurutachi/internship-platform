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
import notificationService from './notificationService';
import { archiveService } from './archiveService';
import { convertScoreToGrade } from '../utils/gradeUtils';
// NOTE: aiService is now used only for admin trend analysis (admin dashboard/analytics)
// Individual evaluation analysis removed in v2.0.0

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export class EvaluationService {
  async create(data: CreateEvaluationDTO): Promise<Evaluation> {
    // Validate evaluation type and week_number
    if (data.evaluation_type === 'weekly' && !data.week_number) {
      throw new Error('week_number is required for weekly evaluations');
    }
    if (data.evaluation_type !== 'weekly' && data.week_number) {
      throw new Error('week_number should only be set for weekly evaluations');
    }

    // Set default evaluation_type if not provided
    const evaluationType = data.evaluation_type || 'final';
    
    // Determine if mandatory (midterm and final are mandatory)
    const isMandatory = evaluationType === 'midterm' || evaluationType === 'final';

    // Fetch advisor_id from internship
    console.log('🔵 [EvaluationService] Fetching advisor_id for internship:', data.internship_id);
    const { data: internship, error: internshipError } = await supabase
      .from('internships')
      .select('advisor_id')
      .eq('id', data.internship_id)
      .single();

    if (internshipError) {
      console.error('❌ [EvaluationService] Error fetching internship:', internshipError);
      throw new Error(`Failed to fetch internship: ${internshipError.message}`);
    }

    const advisorId = internship?.advisor_id || null;
    console.log('✅ [EvaluationService] Found advisor_id:', advisorId);

    const { data: evaluation, error } = await supabase
      .from("evaluations")
      .insert({
        ...data,
        evaluation_type: evaluationType,
        is_mandatory: isMandatory,
        advisor_id: advisorId,
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
    // Step 1: Fetch existing evaluation record with full relationships
    const evaluation = await this.getById(evaluationId);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    // NOTE: AI analysis removed in v2.0.0
    // AI is now used for historical trend analysis on approved evaluations only
    // Not for individual evaluation assistance during submission

    // Step 2: Calculate final grade from total_score using CvSU grade scale
    const totalScore = (evaluation as any).total_score;
    let finalGrade: number | null = null;
    if (totalScore !== null && totalScore !== undefined && totalScore > 0) {
      finalGrade = convertScoreToGrade(totalScore);
      console.log(`📊 [EvaluationService] Calculated grade from total_score: ${totalScore} → ${finalGrade}`);
    }

    // Step 3: Auto-approve evaluation (skip manual approval workflow)
    const now = new Date().toISOString();
    const { data: updatedEvaluation, error: updateError } = await supabase
      .from('evaluations')
      .update({
        status: 'approved',
        submitted_at: now,
        approved_at: now,
        ...(finalGrade !== null ? { final_grade: finalGrade } : {}),
      })
      .eq('id', evaluationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update evaluation: ${updateError.message}`);
    }

    // Step 4: Real-time emit
    emitEvaluationUpdate(evaluationId, {
      event: 'evaluation_approved',
      evaluation: updatedEvaluation,
    });

    // Step 5: Notify advisor that evaluation was submitted and auto-approved
    const advisorId = (evaluation as any).internship?.advisor_id;
    if (advisorId) {
      try {
        const student = (evaluation as any).internship?.student;
        const studentName = student 
          ? `${student.first_name} ${student.last_name}`
          : 'A student';
        
        await notificationService.createNotification({
          user_id: advisorId,
          type: 'evaluation_submitted',
          title: 'Evaluation Submitted & Approved',
          message: `An evaluation for ${studentName} has been submitted by the supervisor and automatically approved${finalGrade ? ` with a grade of ${finalGrade}` : ''}.`,
          action_url: `/dashboard/advisor/evaluations`,
          reference_type: 'evaluation',
        });
      } catch (notifError) {
        console.error('⚠️ Failed to send evaluation notification:', notifError);
      }
    }

    // Step 6: Notify student that their evaluation is approved
    const studentId = (evaluation as any)?.internship?.student?.id;
    if (studentId) {
      try {
        await notificationService.createNotification({
          user_id: studentId,
          type: 'evaluation_approved',
          title: 'Evaluation Approved',
          message: `Your internship evaluation has been approved${finalGrade ? ` with a final grade of ${finalGrade}` : ''}.`,
          action_url: `/dashboard/student/evaluations`,
          reference_type: 'evaluation',
        });
      } catch (notifError) {
        console.error('⚠️ Failed to send student approval notification:', notifError);
      }
    }

    console.log(`✅ Evaluation ${evaluationId} submitted and auto-approved successfully (grade: ${finalGrade})`);

    // Step 7: Check if supervisor has completed all evaluations (for auto-archive)
    if (evaluation.evaluation_type === 'final' && evaluation.supervisor_id) {
      try {
        await archiveService.checkSupervisorEvaluationCompletion(evaluation.supervisor_id);
      } catch (archiveError) {
        console.error('⚠️ Failed to check supervisor evaluation completion:', archiveError);
        // Don't throw - this shouldn't block evaluation submission
      }
    }

    return {
      evaluation: updatedEvaluation,
    };
  }

  async approve(evaluationId: string, finalGrade: number): Promise<Evaluation> {
    // First get evaluation with internship info (getById includes full relationships)
    const evaluation = await this.getById(evaluationId);
    
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

    // Notify student that their evaluation has been approved (using getById result which has relationships)
    const studentId = (evaluation as any)?.internship?.student?.id;
    if (studentId) {
      try {
        await notificationService.createNotification({
          user_id: studentId,
          type: 'evaluation_approved',
          title: 'Evaluation Approved',
          message: `Your internship evaluation has been approved with a final grade of ${finalGrade}.`,
          action_url: `/dashboard/student/evaluations`,
          reference_type: 'evaluation',
        });
      } catch (notifError) {
        console.error('⚠️ Failed to send approval notification:', notifError);
      }
    }

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
    evaluation_type?: 'weekly' | 'midterm' | 'final';
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

    if (filters?.evaluation_type) {
      query = query.eq("evaluation_type", filters.evaluation_type);
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

  /**
   * Get evaluation timeline for an internship
   * Shows all evaluations (weekly, midterm, final) in chronological order
   */
  async getTimelineByInternship(internshipId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        id,
        evaluation_type,
        week_number,
        evaluation_period,
        status,
        rating_overall,
        due_date,
        submitted_at,
        created_at,
        is_mandatory,
        feedback_text
      `)
      .eq('internship_id', internshipId)
      .order('evaluation_type', { ascending: true })
      .order('week_number', { ascending: true, nullsFirst: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Get evaluations by type for an internship
   */
  async getByType(internshipId: string, evaluationType: 'weekly' | 'midterm' | 'final'): Promise<any[]> {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        supervisor:users!supervisor_id(id, first_name, last_name, email)
      `)
      .eq('internship_id', internshipId)
      .eq('evaluation_type', evaluationType)
      .order('week_number', { ascending: true, nullsFirst: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Get weekly evaluations for an internship
   */
  async getWeeklyEvaluations(internshipId: string): Promise<any[]> {
    return this.getByType(internshipId, 'weekly');
  }

  /**
   * Get overdue evaluations (draft evaluations past due date)
   */
  async getOverdueEvaluations(supervisorId?: string): Promise<any[]> {
    let query = supabase
      .from('evaluations')
      .select(`
        *,
        internship:internships(
          id,
          position,
          student:users!student_id(id, first_name, last_name, email),
          company:companies(id, name)
        )
      `)
      .eq('status', 'draft')
      .lt('due_date', new Date().toISOString().split('T')[0]);

    if (supervisorId) {
      query = query.eq('supervisor_id', supervisorId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Get evaluation progress summary for an internship
   * Returns count of completed evaluations by type
   */
  async getProgressSummary(internshipId: string): Promise<{
    weekly: { total: number; completed: number; pending: number };
    midterm: { completed: boolean; status?: string };
    final: { completed: boolean; status?: string };
  }> {
    const { data, error } = await supabase
      .from('evaluations')
      .select('evaluation_type, status, week_number')
      .eq('internship_id', internshipId);

    if (error) throw new Error(error.message);

    const evaluations = data || [];
    
    // Count weekly evaluations
    const weeklyEvals = evaluations.filter(e => e.evaluation_type === 'weekly');
    const weeklyCompleted = weeklyEvals.filter(e => e.status === 'submitted' || e.status === 'processed' || e.status === 'approved').length;
    
    // Check midterm
    const midtermEval = evaluations.find(e => e.evaluation_type === 'midterm');
    
    // Check final
    const finalEval = evaluations.find(e => e.evaluation_type === 'final');

    return {
      weekly: {
        total: weeklyEvals.length,
        completed: weeklyCompleted,
        pending: weeklyEvals.length - weeklyCompleted
      },
      midterm: {
        completed: !!midtermEval && (midtermEval.status === 'submitted' || midtermEval.status === 'processed' || midtermEval.status === 'approved'),
        status: midtermEval?.status
      },
      final: {
        completed: !!finalEval && (finalEval.status === 'submitted' || finalEval.status === 'processed' || finalEval.status === 'approved'),
        status: finalEval?.status
      }
    };
  }
}

