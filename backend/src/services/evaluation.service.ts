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
    return this.crudService.create(data);
  }

  /**
   * Get evaluation by ID with full relations
   */
  async getById(id: string): Promise<Evaluation | null> {
    return this.crudService.getById(id);
  }

  /**
   * Process evaluation with AI analysis
   */
  async processWithAI(evaluationId: string): Promise<any> {
    return this.crudService.processWithAI(evaluationId);
  }

  /**
   * Submit evaluation for review (triggers AI processing)
   */
  async submit(evaluationId: string): Promise<Evaluation> {
    return this.crudService.submit(evaluationId);
  }

  /**
   * Approve evaluation and set final grade
   */
  async approve(evaluationId: string, finalGrade: number): Promise<Evaluation> {
    return this.crudService.approve(evaluationId, finalGrade);
  }

  /**
   * Get all evaluations for an internship
   */
  async getByInternship(internshipId: string): Promise<Evaluation[]> {
    return this.crudService.getByInternship(internshipId);
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
