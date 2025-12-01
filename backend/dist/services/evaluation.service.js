"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsService = exports.EvaluationService = exports.evaluationService = exports.EvaluationServiceFacade = void 0;
const evaluationService_1 = require("./evaluationService");
Object.defineProperty(exports, "EvaluationService", { enumerable: true, get: function () { return evaluationService_1.EvaluationService; } });
const evaluationsService_1 = require("./evaluationsService");
Object.defineProperty(exports, "EvaluationsService", { enumerable: true, get: function () { return evaluationsService_1.EvaluationsService; } });
class EvaluationServiceFacade {
    constructor() {
        this.crudService = new evaluationService_1.EvaluationService();
        this.analyticsService = new evaluationsService_1.EvaluationsService();
    }
    // ============================================================
    // CRUD & AI Operations (from EvaluationService)
    // ============================================================
    /**
     * Create a new evaluation (status: draft)
     */
    async create(data) {
        return this.crudService.create(data);
    }
    /**
     * Get evaluation by ID with full relations
     */
    async getById(id) {
        return this.crudService.getById(id);
    }
    /**
     * Process evaluation with AI analysis
     */
    async processWithAI(evaluationId) {
        return this.crudService.processWithAI(evaluationId);
    }
    /**
     * Submit evaluation for review (triggers AI processing)
     */
    async submit(evaluationId) {
        return this.crudService.submit(evaluationId);
    }
    /**
     * Approve evaluation and set final grade
     */
    async approve(evaluationId, finalGrade) {
        return this.crudService.approve(evaluationId, finalGrade);
    }
    /**
     * Get all evaluations for an internship
     */
    async getByInternship(internshipId) {
        return this.crudService.getByInternship(internshipId);
    }
    // ============================================================
    // Analytics & Metrics (from EvaluationsService)
    // ============================================================
    /**
     * Calculate average rating from all rating fields
     */
    calculateAverageRating(evaluation) {
        return this.analyticsService.calculateAverageRating(evaluation);
    }
    /**
     * Format AI analysis results for display
     */
    formatAIResults(evaluation) {
        return this.analyticsService.formatAIResults(evaluation);
    }
    /**
     * Check if evaluation is ready for approval
     */
    isReadyForApproval(evaluation) {
        return this.analyticsService.isReadyForApproval(evaluation);
    }
    /**
     * Get quality metrics for current month
     */
    async getQualityMetrics() {
        return this.analyticsService.getQualityMetrics();
    }
    /**
     * Get evaluation metrics grouped by supervisor
     */
    async getMetricsBySupervisor() {
        return this.analyticsService.getMetricsBySupervisor();
    }
    /**
     * Get evaluation metrics grouped by company
     */
    async getMetricsByCompany() {
        return this.analyticsService.getMetricsByCompany();
    }
    /**
     * Export evaluations to CSV or JSON
     */
    async exportEvaluations(filters, format, includeAIResults = false) {
        return this.analyticsService.exportEvaluations(filters, format, includeAIResults);
    }
    /**
     * Generate quality report for date range
     */
    async generateQualityReport(startDate, endDate) {
        return this.analyticsService.generateQualityReport(startDate, endDate);
    }
}
exports.EvaluationServiceFacade = EvaluationServiceFacade;
// Export singleton instance
exports.evaluationService = new EvaluationServiceFacade();
//# sourceMappingURL=evaluation.service.js.map