import { Request, Response } from "express";
import { EvaluationService } from "../services/evaluationService";

const evaluationService = new EvaluationService();

/**
 * Analyze draft evaluation text (real-time feedback)
 * POST /api/evaluations/analyze-draft
 */
export async function analyzeDraftEvaluation(req: Request, res: Response) {
    try {
        const { text } = req.body;

        // Validation
        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Text field is required and must be a string',
            });
        }

        if (text.trim().length < 5) {
            return res.status(400).json({
                success: false,
                error: 'Text is too short for analysis (minimum 5 characters)',
            });
        }

        // Call service
        const result = await evaluationService.analyzeDraft(text);

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('Draft analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze draft evaluation',
        });
    }
}

export async function createEvaluation(req: Request, res: Response) {
    try {
        const evaluation = await evaluationService.create(req.body);
        res.status(201).json({success: true, data: evaluation});
    } catch (error: any) {
        res.status(400).json({success: false, error: error.message});
    }
}

export async function getEvaluation(req: Request, res: Response) {
    try {
        const evaluation = await evaluationService.getById(req.params.id);
        if (!evaluation) {
            return res.status(404).json({success: false, error: 'Evaluation not found'});
        }
        res.json({success: true, data: evaluation});
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function updateEvaluation(req: Request, res: Response) {
    try {
        const evaluation = await evaluationService.update(req.params.id, req.body);
        res.json({success: true, data: evaluation});
    } catch (error: any) {
        console.error('Update evaluation error:', error);
        res.status(500).json({success: false, error: error.message});
    }
}

export async function submitEvaluation(req: Request, res: Response) {
    try {
        const evaluation = await evaluationService.submit(req.params.id);
        res.json({success: true, data: evaluation, message: 'Evaluation submitted and processing!'});
    } catch (error: any) {
        console.error('Submit evaluation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({success: false, error: error.message});
    }
}

export async function approveEvaluation(req: Request, res: Response) {
    try {
        const { final_grade } = req.body;
        const evaluation = await evaluationService.approve(req.params.id, final_grade);
        res.json({success: true, data: evaluation});
    } catch (error:any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function getInternshipEvaluations(req: Request, res: Response) {
    try {
        const evaluations = await evaluationService.getByInternship(req.params.internshipId);
        res.json({success: true, data: evaluations})
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message})
    }
}

/**
 * Get evaluations with optional filters
 * GET /api/evaluations?supervisor_id=xxx&status=draft&evaluation_type=weekly
 */
export async function getEvaluations(req: Request, res: Response) {
    try {
        const { supervisor_id, status, evaluation_type, limit, offset } = req.query;

        const evaluations = await evaluationService.getAll({
            supervisor_id: supervisor_id as string,
            status: status as string,
            evaluation_type: evaluation_type as 'weekly' | 'midterm' | 'final' | undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
        });

        res.json({ success: true, data: evaluations });
    } catch (error: any) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get evaluation timeline for an internship
 * GET /api/evaluations/timeline/:internshipId
 */
export async function getEvaluationTimeline(req: Request, res: Response) {
    try {
        const { internshipId } = req.params;
        const timeline = await evaluationService.getTimelineByInternship(internshipId);
        res.json({ success: true, data: timeline });
    } catch (error: any) {
        console.error('Get timeline error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get evaluations by type for an internship
 * GET /api/evaluations/internship/:internshipId/type/:evaluationType
 */
export async function getEvaluationsByType(req: Request, res: Response) {
    try {
        const { internshipId, evaluationType } = req.params;
        
        if (!['weekly', 'midterm', 'final'].includes(evaluationType)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid evaluation type. Must be weekly, midterm, or final' 
            });
        }

        const evaluations = await evaluationService.getByType(
            internshipId, 
            evaluationType as 'weekly' | 'midterm' | 'final'
        );
        res.json({ success: true, data: evaluations });
    } catch (error: any) {
        console.error('Get evaluations by type error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get overdue evaluations
 * GET /api/evaluations/overdue?supervisor_id=xxx
 */
export async function getOverdueEvaluations(req: Request, res: Response) {
    try {
        const { supervisor_id } = req.query;
        const evaluations = await evaluationService.getOverdueEvaluations(supervisor_id as string);
        res.json({ success: true, data: evaluations });
    } catch (error: any) {
        console.error('Get overdue evaluations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get evaluation progress summary for an internship
 * GET /api/evaluations/progress/:internshipId
 */
export async function getEvaluationProgress(req: Request, res: Response) {
    try {
        const { internshipId } = req.params;
        const progress = await evaluationService.getProgressSummary(internshipId);
        res.json({ success: true, data: progress });
    } catch (error: any) {
        console.error('Get evaluation progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
