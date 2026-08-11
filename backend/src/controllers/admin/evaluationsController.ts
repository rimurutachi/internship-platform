import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { evaluationService } from '../../services/evaluation.service';
import { AuthRequest } from '../../middleware/auth';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export class EvaluationsController {
  private evaluationService = evaluationService;

  /**
   * Get all evaluations with filters
   * GET /admin/evaluations
   */
  getEvaluations = async (req: AuthRequest, res: Response) => {
    console.log('[AdminEvaluations] getEvaluations request', { filters: req.query, user: req.user?.id });
    try {
      const {
        page = '1',
        limit = '20',
        status,
        supervisor_id,
        company_id,
        date_range,
        search,
      } = req.query;

      const pageNum = Number(page as string);
      const limitNum = Number(limit as string);

      let query = supabase
        .from('evaluations')
        .select(
          `
          *,
          criterion_scores:evaluation_criterion_scores(*),
          internship:internships(
            *,
            student:users!internships_student_id_fkey(id, name, email),
            supervisor:users!internships_supervisor_id_fkey(id, name, email),
            company:companies(id, name)
          )
        `,
          { count: 'exact' }
        );

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (supervisor_id) {
        query = query.eq('supervisor_id', supervisor_id);
      }
      if (company_id) {
        // Filter through internship's company
        query = query.eq('internship.company_id', company_id);
      }
      if (date_range && typeof date_range === 'string') {
        try {
          const { start, end } = JSON.parse(date_range);
          if (start) query = query.gte('created_at', start);
          if (end) query = query.lte('created_at', end);
        } catch (e) {
          // Invalid date_range format, skip
        }
      }

      // Calculate offset
      const offset = (pageNum - 1) * limitNum;
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (error) {
        console.error('Error fetching evaluations:', error);
        return res.status(500).json({ error: error.message });
      }

      // Get metrics
      const metrics = await this.evaluationService.getQualityMetrics();

      console.log('[AdminEvaluations] getEvaluations success', { count: count || 0, page: pageNum });
      res.json({
        success: true,
        data: {
          evaluations: data || [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limitNum),
          },
          metrics,
        },
      });
    } catch (error) {
      console.error('Error in getEvaluations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get single evaluation with details
   * GET /admin/evaluations/:id
   */
  getEvaluation = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data: evaluation, error } = await supabase
        .from('evaluations')
        .select(
          `
          *,
          criterion_scores:evaluation_criterion_scores(*),
          internship:internships(
            *,
            student:users!internships_student_id_fkey(id, name, email),
            supervisor:users!internships_supervisor_id_fkey(id, name, email),
            advisor:users!internships_advisor_id_fkey(id, name, email),
            company:companies(id, name)
          )
        `
        )
        .eq('id', id)
        .single();

      if (error || !evaluation) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      // Get activity log
      const { data: logs } = await supabase
        .from('activity_log')
        .select('*')
        .eq('entity_id', id)
        .eq('entity_type', 'evaluation')
        .order('created_at', { ascending: false });

      console.log('[AdminEvaluations] getEvaluation success', { evaluationId: id, hasCriterionScores: !!evaluation.criterion_scores });

      res.json({
        success: true,
        data: {
          evaluation,
          activity_log: logs || [],
        },
      });
    } catch (error) {
      console.error('Error in getEvaluation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get AI results for evaluation
   * GET /admin/evaluations/:id/ai-results
   */
  getAIResults = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data: evaluation, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !evaluation) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      if (
        evaluation.status !== 'processed' &&
        evaluation.status !== 'approved'
      ) {
        return res.status(400).json({
          error: 'Evaluation not yet processed by AI',
          status: evaluation.status,
        });
      }

      const aiResults = this.evaluationService.formatAIResults(evaluation);

      res.json({
        success: true,
        data: {
          ai_results: aiResults,
        },
      });
    } catch (error) {
      console.error('Error in getAIResults:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Validate sentiment analysis
   * PATCH /admin/evaluations/:id/validate-sentiment
   */
  validateSentiment = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { is_accurate, notes } = req.body;

      // Log validation
      const { error } = await supabase.from('activity_log').insert({
        user_id: req.user?.id,
        action: 'sentiment_validated',
        entity_type: 'evaluation',
        entity_id: id,
        description: `Admin validated sentiment analysis - Accurate: ${is_accurate}`,
        metadata: { accurate: is_accurate, notes },
      });

      if (error) {
        console.error('Error logging sentiment validation:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json({
        success: true,
        data: { message: 'Sentiment validation recorded' },
      });
    } catch (error) {
      console.error('Error in validateSentiment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Validate feature extraction
   * PATCH /admin/evaluations/:id/validate-features
   */
  validateFeatures = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { is_correct, corrections } = req.body;

      // Log validation
      const { error } = await supabase.from('activity_log').insert({
        user_id: req.user?.id,
        action: 'features_validated',
        entity_type: 'evaluation',
        entity_id: id,
        description: `Admin validated feature extraction - Correct: ${is_correct}`,
        metadata: { correct: is_correct, corrections },
      });

      if (error) {
        console.error('Error logging feature validation:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json({
        success: true,
        data: { message: 'Feature validation recorded' },
      });
    } catch (error) {
      console.error('Error in validateFeatures:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Validate bias check
   * PATCH /admin/evaluations/:id/validate-bias
   */
  validateBias = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { passed, reason } = req.body;

      // Log validation
      const { error } = await supabase.from('activity_log').insert({
        user_id: req.user?.id,
        action: 'bias_check_validated',
        entity_type: 'evaluation',
        entity_id: id,
        description: `Admin reviewed bias check - Passed: ${passed}`,
        metadata: { passed, reason },
      });

      if (error) {
        console.error('Error logging bias validation:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json({
        success: true,
        data: { message: 'Bias check validation recorded' },
      });
    } catch (error) {
      console.error('Error in validateBias:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Approve evaluation
   * POST /admin/evaluations/:id/approve
   */
  approveEvaluation = async (req: AuthRequest, res: Response) => {
    console.log('[AdminEvaluations] approveEvaluation request', { evaluationId: req.params.id, finalGrade: req.body.final_grade, user: req.user?.id });
    try {
      const { id } = req.params;
      const { final_grade, notes, use_ai_grade } = req.body;

      // Get evaluation with internship to fetch advisor_id
      const { data: evaluation, error: fetchError } = await supabase
        .from('evaluations')
        .select(`
          *,
          internship:internships(
            id,
            advisor_id
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError || !evaluation) {
        console.error('[AdminEvaluations] Evaluation not found:', fetchError);
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      // Get advisor_id from internship
      const advisorId = evaluation.internship?.advisor_id || null;

      // Determine final grade
      let gradeToSet: number | null = null;
      if (final_grade !== undefined && final_grade !== null) {
        gradeToSet = final_grade;
      } else if (use_ai_grade && evaluation.recommended_grade !== null) {
        gradeToSet = evaluation.recommended_grade;
      }

      if (gradeToSet === null) {
        return res.status(400).json({ error: 'Final grade required' });
      }

      // Validate grade range (CvSU scale: 1.0 to 5.0)
      if (gradeToSet < 1.0 || gradeToSet > 5.0) {
        return res
          .status(400)
          .json({ error: 'Grade must be between 1.0 and 5.0 (CvSU scale)' });
      }

      // Update evaluation with advisor_id and approved_at
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('evaluations')
        .update({
          status: 'approved',
          final_grade: gradeToSet,
          advisor_id: advisorId,
          approved_at: now,
          processed_at: now,
        })
        .eq('id', id);

      console.log('[AdminEvaluations] Updated evaluation with advisor_id:', advisorId, 'approved_at:', now);

      if (updateError) {
        console.error('Error approving evaluation:', updateError);
        return res.status(500).json({ error: updateError.message });
      }

      // Log approval
      await supabase.from('activity_log').insert({
        user_id: req.user?.id,
        action: 'evaluation_approved',
        entity_type: 'evaluation',
        entity_id: id,
        description: `Admin approved evaluation with final grade: ${gradeToSet}`,
        metadata: { final_grade: gradeToSet, notes, use_ai_grade },
      });

      console.log('[AdminEvaluations] approveEvaluation success', { evaluationId: id, finalGrade: gradeToSet });
      res.json({
        success: true,
        data: { message: 'Evaluation approved successfully' },
      });
    } catch (error) {
      console.error('Error in approveEvaluation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Override grade
   * POST /admin/evaluations/:id/override-grade
   */
  overrideGrade = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { new_grade, reason } = req.body;

      if (!new_grade || !reason) {
        return res
          .status(400)
          .json({ error: 'New grade and reason are required' });
      }

      if (new_grade < 0 || new_grade > 100) {
        return res
          .status(400)
          .json({ error: 'Grade must be between 0 and 100' });
      }

      // Get current evaluation
      const { data: evaluation, error: fetchError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !evaluation) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      const originalGrade =
        evaluation.final_grade || evaluation.recommended_grade;

      // Update with override
      const { error: updateError } = await supabase
        .from('evaluations')
        .update({
          final_grade: new_grade,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error overriding grade:', updateError);
        return res.status(500).json({ error: updateError.message });
      }

      // Log override
      await supabase.from('activity_log').insert({
        user_id: req.user?.id,
        action: 'grade_overridden',
        entity_type: 'evaluation',
        entity_id: id,
        description: `Admin overrode grade from ${originalGrade} to ${new_grade}`,
        metadata: { original_grade: originalGrade, new_grade, reason },
      });

      res.json({
        success: true,
        data: { message: 'Grade overridden successfully' },
      });
    } catch (error) {
      console.error('Error in overrideGrade:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Reject evaluation
   * POST /admin/evaluations/:id/reject
   */
  rejectEvaluation = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, comments } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Reason is required' });
      }

      // Set status back to submitted for supervisor to revise
      const { error: updateError } = await supabase
        .from('evaluations')
        .update({
          status: 'submitted',
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error rejecting evaluation:', updateError);
        return res.status(500).json({ error: updateError.message });
      }

      // Log rejection
      await supabase.from('activity_log').insert({
        user_id: req.user?.id,
        action: 'evaluation_rejected',
        entity_type: 'evaluation',
        entity_id: id,
        description: `Admin rejected evaluation - Reason: ${reason}`,
        metadata: { reason, comments },
      });

      // TODO: Send notification to supervisor

      res.json({
        success: true,
        data: { message: 'Evaluation rejected and returned to supervisor' },
      });
    } catch (error) {
      console.error('Error in rejectEvaluation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Request AI reprocess
   * POST /admin/evaluations/:id/request-reprocess
   */
  requestReprocess = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Log request
      await supabase.from('activity_log').insert({
        user_id: req.user?.id,
        action: 'reprocess_requested',
        entity_type: 'evaluation',
        entity_id: id,
        description: 'Admin requested AI reprocessing',
        metadata: { reason },
      });

      // TODO: Call AI service to reprocess
      // For now, just log the request
      // When AI service is ready:
      // const aiJob = await callAIService({ evaluation_id: id });

      res.json({
        success: true,
        data: {
          message: 'Reprocessing requested. AI will process this evaluation.',
        },
      });
    } catch (error) {
      console.error('Error in requestReprocess:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get quality metrics
   * GET /admin/evaluations/metrics/quality
   */
  getQualityMetrics = async (req: AuthRequest, res: Response) => {
    try {
      const metrics = await this.evaluationService.getQualityMetrics();

      res.json({
        success: true,
        data: { metrics },
      });
    } catch (error) {
      console.error('Error in getQualityMetrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get metrics by supervisor
   * GET /admin/evaluations/metrics/by-supervisor
   */
  getMetricsBySupervisor = async (req: AuthRequest, res: Response) => {
    try {
      const metrics =
        await this.evaluationService.getMetricsBySupervisor();

      res.json({
        success: true,
        data: { supervisors: metrics },
      });
    } catch (error) {
      console.error('Error in getMetricsBySupervisor:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Get metrics by company
   * GET /admin/evaluations/metrics/by-company
   */
  getMetricsByCompany = async (req: AuthRequest, res: Response) => {
    try {
      const metrics = await this.evaluationService.getMetricsByCompany();

      res.json({
        success: true,
        data: { companies: metrics },
      });
    } catch (error) {
      console.error('Error in getMetricsByCompany:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Bulk approve evaluations
   * POST /admin/evaluations/bulk-approve
   */
  bulkApprove = async (req: AuthRequest, res: Response) => {
    try {
      const { evaluation_ids } = req.body;

      if (
        !Array.isArray(evaluation_ids) ||
        evaluation_ids.length === 0
      ) {
        return res
          .status(400)
          .json({ error: 'Evaluation IDs array is required' });
      }

      let approvedCount = 0;
      let failedCount = 0;
      const errors: any[] = [];

      for (const id of evaluation_ids) {
        try {
          const { data: evaluation } = await supabase
            .from('evaluations')
            .select('*')
            .eq('id', id)
            .single();

          if (!evaluation) {
            failedCount++;
            errors.push({ id, error: 'Evaluation not found' });
            continue;
          }

          if (!this.evaluationService.isReadyForApproval(evaluation)) {
            failedCount++;
            errors.push({ id, error: 'Evaluation not ready for approval' });
            continue;
          }

          const gradeToSet =
            evaluation.final_grade || evaluation.recommended_grade;

          if (!gradeToSet) {
            failedCount++;
            errors.push({ id, error: 'No grade available' });
            continue;
          }

          await supabase
            .from('evaluations')
            .update({
              status: 'approved',
              final_grade: gradeToSet,
              processed_at: new Date().toISOString(),
            })
            .eq('id', id);

          await supabase.from('activity_log').insert({
            user_id: req.user?.id,
            action: 'evaluation_approved',
            entity_type: 'evaluation',
            entity_id: id,
            description: `Admin bulk-approved evaluation with final grade: ${gradeToSet}`,
            metadata: { final_grade: gradeToSet, bulk_operation: true },
          });

          approvedCount++;
        } catch (error) {
          failedCount++;
          errors.push({ id, error: 'Processing error' });
        }
      }

      res.json({
        success: true,
        data: {
          approved_count: approvedCount,
          failed_count: failedCount,
          errors,
        },
      });
    } catch (error) {
      console.error('Error in bulkApprove:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Bulk export evaluations
   * POST /admin/evaluations/bulk-export
   */
  bulkExport = async (req: AuthRequest, res: Response) => {
    try {
      const { format = 'json', filters = {}, include_ai_results = false } = req.body;

      const exportData = await this.evaluationService.exportEvaluations(
        filters,
        format as 'json' | 'csv',
        include_ai_results
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=evaluations-export-${Date.now()}.csv`
        );
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=evaluations-export-${Date.now()}.json`
        );
      }

      res.send(exportData);
    } catch (error) {
      console.error('Error in bulkExport:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
