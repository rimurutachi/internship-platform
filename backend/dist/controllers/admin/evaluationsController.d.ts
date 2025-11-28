import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare class EvaluationsController {
    private evaluationsService;
    constructor();
    /**
     * Get all evaluations with filters
     * GET /admin/evaluations
     */
    getEvaluations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get single evaluation with details
     * GET /admin/evaluations/:id
     */
    getEvaluation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get AI results for evaluation
     * GET /admin/evaluations/:id/ai-results
     */
    getAIResults: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Validate sentiment analysis
     * PATCH /admin/evaluations/:id/validate-sentiment
     */
    validateSentiment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Validate feature extraction
     * PATCH /admin/evaluations/:id/validate-features
     */
    validateFeatures: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Validate bias check
     * PATCH /admin/evaluations/:id/validate-bias
     */
    validateBias: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Approve evaluation
     * POST /admin/evaluations/:id/approve
     */
    approveEvaluation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Override grade
     * POST /admin/evaluations/:id/override-grade
     */
    overrideGrade: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Reject evaluation
     * POST /admin/evaluations/:id/reject
     */
    rejectEvaluation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Request AI reprocess
     * POST /admin/evaluations/:id/request-reprocess
     */
    requestReprocess: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Get quality metrics
     * GET /admin/evaluations/metrics/quality
     */
    getQualityMetrics: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Get metrics by supervisor
     * GET /admin/evaluations/metrics/by-supervisor
     */
    getMetricsBySupervisor: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Get metrics by company
     * GET /admin/evaluations/metrics/by-company
     */
    getMetricsByCompany: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Bulk approve evaluations
     * POST /admin/evaluations/bulk-approve
     */
    bulkApprove: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Bulk export evaluations
     * POST /admin/evaluations/bulk-export
     */
    bulkExport: (req: AuthRequest, res: Response) => Promise<void>;
}
//# sourceMappingURL=evaluationsController.d.ts.map