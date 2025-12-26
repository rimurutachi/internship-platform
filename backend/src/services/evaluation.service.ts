/**
 * Evaluation Service Facade
 * 
 * Unified interface combining:
 * - EvaluationService: Core CRUD + AI processing
 * - EvaluationsService: Analytics, metrics, and export
 * 
 * This facade provides a clean, single entry point for all evaluation-related operations
 * while maintaining backward compatibility with existing services.
 */

import { EvaluationService } from './evaluationService';
import { EvaluationsService } from './evaluationsService';
import { Evaluation, CreateEvaluationDTO } from '../models/evaluation';

export class EvaluationServiceFacade {
  // Service instances
  private crudService: EvaluationService;
  private analyticsService: EvaluationsService;

  constructor() {
    this.crudService = new EvaluationService();
    this.analyticsService = new EvaluationsService();
  }

  // ============================================================
  // CRUD & AI Operations (from EvaluationService)
  // ============================================================

  /**
   * Create a new evaluation (status: draft)
   */
  async create(data: CreateEvaluationDTO): Promise<Evaluation> {
    console.log('[EvaluationFacade] create start', { internshipId: data.internship_id, supervisorId: data.supervisor_id, evaluationType: data.evaluation_type });
    try {
      const result = await this.crudService.create(data);
      console.log('[EvaluationFacade] create success', { evaluationId: result.id, internshipId: result.internship_id });
      return result;
    } catch (error) {
      console.error('[EvaluationFacade] create failed', { internshipId: data.internship_id, error });
      throw error;
    }
  }

  /**
   * Get evaluation by ID with full relations
   */
  async getById(id: string): Promise<Evaluation | null> {
    console.log('[EvaluationFacade] getById', { evaluationId: id });
    try {
      return await this.crudService.getById(id);
    } catch (error) {
      console.error('[EvaluationFacade] getById failed', { evaluationId: id, error });
      throw error;
    }
  }

  /**
   * Process evaluation with AI analysis
   */
  async processWithAI(evaluationId: string): Promise<any> {
    console.log('[EvaluationFacade] processWithAI start', { evaluationId: evaluationId });
    try {
      const result = await this.crudService.processWithAI(evaluationId);
      console.log('[EvaluationFacade] processWithAI success', { evaluationId: evaluationId });
      return result;
    } catch (error) {
      console.error('[EvaluationFacade] processWithAI failed', { evaluationId: evaluationId, error });
      throw error;
    }
  }

  /**
   * Analyze draft text for quick feedback (no persistence)
   */
  async analyzeDraft(text: string): Promise<any> {
    console.log('[EvaluationFacade] analyzeDraft start');
    try {
      const result = await this.crudService.analyzeDraft(text);
      console.log('[EvaluationFacade] analyzeDraft success');
      return result;
    } catch (error) {
      console.error('[EvaluationFacade] analyzeDraft failed', { error });
      throw error;
    }
  }

  /**
   * Update draft evaluation (only allowed while status is draft)
   */
  async update(id: string, data: any): Promise<Evaluation> {
    console.log('[EvaluationFacade] update start', { evaluationId: id });
    try {
      const result = await this.crudService.update(id, data);
      console.log('[EvaluationFacade] update success', { evaluationId: id });
      return result;
    } catch (error) {
      console.error('[EvaluationFacade] update failed', { evaluationId: id, error });
      throw error;
    }
  }

  /**
   * Submit evaluation for review (triggers AI processing)
   */
  async submit(evaluationId: string): Promise<Evaluation> {
    console.log('[EvaluationFacade] submit start', { evaluationId: evaluationId });
    try {
      const result = await this.crudService.submit(evaluationId);
      console.log('[EvaluationFacade] submit success', { evaluationId: evaluationId });
      return result as any;
    } catch (error) {
      console.error('[EvaluationFacade] submit failed', { evaluationId: evaluationId, error });
      throw error;
    }
  }

  /**
   * Approve evaluation and set final grade
   */
  async approve(evaluationId: string, finalGrade: number): Promise<Evaluation> {
    console.log('[EvaluationFacade] approve start', { evaluationId: evaluationId, finalGrade });
    try {
      const result = await this.crudService.approve(evaluationId, finalGrade);
      console.log('[EvaluationFacade] approve success', { evaluationId: evaluationId });
      return result;
    } catch (error) {
      console.error('[EvaluationFacade] approve failed', { evaluationId: evaluationId, error });
      throw error;
    }
  }

  /**
   * Get all evaluations for an internship
   */
  async getByInternship(internshipId: string): Promise<Evaluation[]> {
    console.log('[EvaluationFacade] getByInternship', { internshipId });
    try {
      return await this.crudService.getByInternship(internshipId);
    } catch (error) {
      console.error('[EvaluationFacade] getByInternship failed', { internshipId, error });
      throw error;
    }
  }

  /**
   * Get evaluations with filters (supervisor/status/type)
   */
  async getAll(filters?: {
    supervisor_id?: string;
    status?: string;
    evaluation_type?: 'weekly' | 'midterm' | 'final';
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    console.log('[EvaluationFacade] getAll', { filters });
    try {
      return await this.crudService.getAll(filters);
    } catch (error) {
      console.error('[EvaluationFacade] getAll failed', { filters, error });
      throw error;
    }
  }

  /**
   * Timeline of evaluations for an internship
   */
  async getTimelineByInternship(internshipId: string): Promise<any[]> {
    console.log('[EvaluationFacade] getTimelineByInternship', { internshipId });
    try {
      return await this.crudService.getTimelineByInternship(internshipId);
    } catch (error) {
      console.error('[EvaluationFacade] getTimelineByInternship failed', { internshipId, error });
      throw error;
    }
  }

  /**
   * Get evaluations by type for an internship
   */
  async getByType(internshipId: string, evaluationType: 'weekly' | 'midterm' | 'final'): Promise<any[]> {
    console.log('[EvaluationFacade] getByType', { internshipId, evaluationType });
    try {
      return await this.crudService.getByType(internshipId, evaluationType);
    } catch (error) {
      console.error('[EvaluationFacade] getByType failed', { internshipId, evaluationType, error });
      throw error;
    }
  }

  /**
   * Get overdue evaluations (draft past due)
   */
  async getOverdueEvaluations(supervisorId?: string): Promise<any[]> {
    console.log('[EvaluationFacade] getOverdueEvaluations', { supervisorId });
    try {
      return await this.crudService.getOverdueEvaluations(supervisorId);
    } catch (error) {
      console.error('[EvaluationFacade] getOverdueEvaluations failed', { supervisorId, error });
      throw error;
    }
  }

  /**
   * Progress summary for an internship
   */
  async getProgressSummary(internshipId: string): Promise<{
    weekly: { total: number; completed: number; pending: number };
    midterm: { completed: boolean; status?: string };
    final: { completed: boolean; status?: string };
  }> {
    console.log('[EvaluationFacade] getProgressSummary', { internshipId });
    try {
      return await this.crudService.getProgressSummary(internshipId);
    } catch (error) {
      console.error('[EvaluationFacade] getProgressSummary failed', { internshipId, error });
      throw error;
    }
  }

  // ============================================================
  // Analytics & Metrics (from EvaluationsService)
  // ============================================================

  /**
   * Calculate average rating from all rating fields
   */
  calculateAverageRating(evaluation: any): number {
    return this.analyticsService.calculateAverageRating(evaluation);
  }

  /**
   * Format AI analysis results for display
   */
  formatAIResults(evaluation: any): any {
    return this.analyticsService.formatAIResults(evaluation);
  }

  /**
   * Check if evaluation is ready for approval
   */
  isReadyForApproval(evaluation: any): boolean {
    return this.analyticsService.isReadyForApproval(evaluation);
  }

  /**
   * Get quality metrics for current month
   */
  async getQualityMetrics(): Promise<any> {
    return this.analyticsService.getQualityMetrics();
  }

  /**
   * Get evaluation metrics grouped by supervisor
   */
  async getMetricsBySupervisor(): Promise<any> {
    return this.analyticsService.getMetricsBySupervisor();
  }

  /**
   * Get evaluation metrics grouped by company
   */
  async getMetricsByCompany(): Promise<any> {
    return this.analyticsService.getMetricsByCompany();
  }

  /**
   * Export evaluations to CSV or JSON
   */
  async exportEvaluations(
    filters: any,
    format: 'csv' | 'json',
    includeAIResults: boolean = false
  ): Promise<string> {
    return this.analyticsService.exportEvaluations(filters, format, includeAIResults);
  }

  /**
   * Generate quality report for date range
   */
  async generateQualityReport(startDate: Date, endDate: Date): Promise<any> {
    return this.analyticsService.generateQualityReport(startDate, endDate);
  }
}

// Export singleton instance
export const evaluationService = new EvaluationServiceFacade();

// Export individual services for backward compatibility
export { EvaluationService, EvaluationsService };
